import asyncio
import json
import logging
import re
from collections.abc import AsyncIterator

import httpx

from app.config import settings
from app.services import companion
from app.services.prompts import build_system_prompt
from app.services.resources import crisis_message

log = logging.getLogger("lantern.llm")


class LLMError(RuntimeError):
    pass


async def _stream_openai_compatible(messages: list[dict]) -> AsyncIterator[str]:
    headers = {"Content-Type": "application/json"}
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"
    body = {
        "model": settings.llm_model,
        "messages": messages,
        "temperature": settings.llm_temperature,
        "max_tokens": settings.llm_max_tokens,
        "stream": True,
    }
    url = settings.llm_base_url.rstrip("/") + "/chat/completions"
    async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
        async with client.stream("POST", url, headers=headers, json=body) as resp:
            if resp.status_code != 200:
                detail = (await resp.aread()).decode(errors="ignore")[:300]
                raise LLMError(f"LLM returned {resp.status_code}: {detail}")
            async for line in resp.aiter_lines():
                if not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    break
                try:
                    chunk = json.loads(data)
                    delta = chunk["choices"][0].get("delta", {}).get("content")
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue
                if delta:
                    yield delta


async def _stream_text(text: str) -> AsyncIterator[str]:
    """Emit canned text in small pieces so the offline mode streams like the real one."""
    for piece in re.findall(r"\S+\s*", text):
        yield piece
        await asyncio.sleep(0.025)


async def generate_reply(
    history: list[dict], risk_level: str, display_name: str | None
) -> AsyncIterator[str]:
    """Yield the assistant reply in chunks.

    `history` is the recent conversation, oldest first, ending with the user's
    newest message. Falls back to the offline companion if the model is not
    configured or fails before producing any text.
    """
    latest = history[-1]["content"] if history else ""

    if settings.llm_enabled:
        messages = [{"role": "system", "content": build_system_prompt(display_name, risk_level)}]
        messages += history
        produced = False
        try:
            async for chunk in _stream_openai_compatible(messages):
                produced = True
                yield chunk
            if produced:
                return
        except (httpx.HTTPError, LLMError) as exc:
            log.warning("LLM call failed, using offline companion: %s", exc)
            if produced:
                return

    if risk_level == "crisis":
        text = crisis_message()
    else:
        text = companion.reply_for(latest, display_name, turn=len(history))
    async for piece in _stream_text(text):
        yield piece


def make_title(text: str, max_words: int = 6) -> str:
    words = re.sub(r"\s+", " ", text).strip().split(" ")
    title = " ".join(words[:max_words])
    if len(words) > max_words:
        title += "…"
    title = title[:1].upper() + title[1:]
    return title[:120] or "New conversation"
