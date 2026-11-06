import json

import httpx

from app.config import settings
from app.services import llm


def _fake_client_factory(handler):
    real = httpx.AsyncClient

    def factory(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(handler)
        return real(*args, **kwargs)

    return factory


async def _collect(gen):
    return "".join([c async for c in gen])


async def test_streams_from_openai_compatible_endpoint(monkeypatch):
    seen = {}

    def handler(request: httpx.Request):
        seen["auth"] = request.headers.get("authorization")
        seen["body"] = json.loads(request.content)
        chunks = ["That sounds ", "really hard."]
        body = "".join(
            f"data: {json.dumps({'choices': [{'delta': {'content': c}}]})}\n\n" for c in chunks
        ) + "data: [DONE]\n\n"
        return httpx.Response(200, text=body, headers={"content-type": "text/event-stream"})

    monkeypatch.setattr(settings, "llm_api_key", "test-key")
    monkeypatch.setattr(llm.httpx, "AsyncClient", _fake_client_factory(handler))

    history = [{"role": "user", "content": "I feel like giving up on everything"}]
    out = await _collect(llm.generate_reply(history, "elevated", "Asha"))

    assert out == "That sounds really hard."
    assert seen["auth"] == "Bearer test-key"
    system = seen["body"]["messages"][0]
    assert system["role"] == "system" and "Safety note" in system["content"]
    assert seen["body"]["stream"] is True


async def test_falls_back_when_model_errors(monkeypatch):
    def handler(request):
        return httpx.Response(500, text="upstream down")

    monkeypatch.setattr(settings, "llm_api_key", "test-key")
    monkeypatch.setattr(llm.httpx, "AsyncClient", _fake_client_factory(handler))

    out = await _collect(
        llm.generate_reply([{"role": "user", "content": "I want to die"}], "crisis", None)
    )
    assert "14416" in out  # offline crisis reply still reaches the user
