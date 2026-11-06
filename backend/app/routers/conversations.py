import json
import logging
import uuid

from fastapi import APIRouter, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import SessionLocal
from app.deps import CurrentUser, DbSession
from app.models import Conversation, Message, utcnow
from app.rate_limit import message_limiter
from app.schemas import (
    ConversationCreate,
    ConversationDetail,
    ConversationOut,
    ConversationUpdate,
    MessageIn,
    MessageOut,
)
from app.services.llm import generate_reply, make_title
from app.services.safety import assess

log = logging.getLogger("lantern.chat")
router = APIRouter(prefix="/conversations", tags=["conversations"])

DEFAULT_TITLE = "New conversation"


async def _owned(session, conversation_id: uuid.UUID, user_id: uuid.UUID, with_messages=False):
    stmt = select(Conversation).where(
        Conversation.id == conversation_id, Conversation.user_id == user_id
    )
    if with_messages:
        stmt = stmt.options(selectinload(Conversation.messages))
    convo = await session.scalar(stmt)
    if convo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found.")
    return convo


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"


@router.get("", response_model=list[ConversationOut])
async def list_conversations(user: CurrentUser, session: DbSession):
    rows = await session.scalars(
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .limit(200)
    )
    return rows.all()


@router.post("", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def create_conversation(body: ConversationCreate, user: CurrentUser, session: DbSession):
    convo = Conversation(user_id=user.id, title=(body.title or DEFAULT_TITLE).strip() or DEFAULT_TITLE)
    session.add(convo)
    await session.commit()
    await session.refresh(convo)
    return convo


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: uuid.UUID, user: CurrentUser, session: DbSession):
    return await _owned(session, conversation_id, user.id, with_messages=True)


@router.patch("/{conversation_id}", response_model=ConversationOut)
async def rename_conversation(
    conversation_id: uuid.UUID, body: ConversationUpdate, user: CurrentUser, session: DbSession
):
    convo = await _owned(session, conversation_id, user.id)
    convo.title = body.title.strip()
    await session.commit()
    await session.refresh(convo)
    return convo


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(conversation_id: uuid.UUID, user: CurrentUser, session: DbSession):
    convo = await _owned(session, conversation_id, user.id)
    await session.delete(convo)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: uuid.UUID, body: MessageIn, user: CurrentUser, session: DbSession
):
    """Save the user's message, then stream the reply as server-sent events.

    Events, in order:
      meta  -> {user_message, risk_level, title}
      token -> {text}            (many)
      done  -> {message}         (the saved assistant message)
      error -> {detail}          (only if saving fails)
    """
    message_limiter.check(str(user.id))
    convo = await _owned(session, conversation_id, user.id)

    risk = assess(body.content)
    user_msg = Message(
        conversation_id=convo.id, role="user", content=body.content, risk_level=risk.level
    )
    session.add(user_msg)
    if convo.title == DEFAULT_TITLE:
        convo.title = make_title(body.content)
    convo.updated_at = utcnow()
    await session.commit()
    await session.refresh(user_msg)

    recent = await session.scalars(
        select(Message)
        .where(Message.conversation_id == convo.id)
        .order_by(Message.created_at.desc())
        .limit(settings.history_window)
    )
    history = [{"role": m.role, "content": m.content} for m in reversed(recent.all())]

    # Capture plain values; the request session is not used inside the stream.
    convo_id, title, display_name = convo.id, convo.title, user.display_name
    meta = {
        "user_message": MessageOut.model_validate(user_msg).model_dump(mode="json"),
        "risk_level": risk.level,
        "title": title,
    }

    async def event_stream():
        yield _sse("meta", meta)
        parts: list[str] = []
        async for chunk in generate_reply(history, risk.level, display_name):
            parts.append(chunk)
            yield _sse("token", {"text": chunk})

        content = "".join(parts).strip()
        try:
            async with SessionLocal() as s:
                conv = await s.get(Conversation, convo_id)
                if conv is None:
                    return  # deleted while we were replying
                reply = Message(conversation_id=convo_id, role="assistant", content=content)
                s.add(reply)
                conv.updated_at = utcnow()
                await s.commit()
                await s.refresh(reply)
                yield _sse("done", {"message": MessageOut.model_validate(reply).model_dump(mode="json")})
        except SQLAlchemyError:
            log.exception("Failed to save assistant reply")
            yield _sse("error", {"detail": "The reply could not be saved. Please try again."})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
