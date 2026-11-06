import uuid
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.models import MoodEntry, utcnow
from app.schemas import MoodIn, MoodOut

router = APIRouter(prefix="/moods", tags=["moods"])


@router.get("", response_model=list[MoodOut])
async def list_moods(user: CurrentUser, session: DbSession, days: int = Query(30, ge=1, le=365)):
    since = utcnow() - timedelta(days=days)
    rows = await session.scalars(
        select(MoodEntry)
        .where(MoodEntry.user_id == user.id, MoodEntry.created_at >= since)
        .order_by(MoodEntry.created_at.desc())
    )
    return rows.all()


@router.post("", response_model=MoodOut, status_code=status.HTTP_201_CREATED)
async def create_mood(body: MoodIn, user: CurrentUser, session: DbSession):
    entry = MoodEntry(
        user_id=user.id, score=body.score, tags=body.tags, note=(body.note or "").strip() or None
    )
    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return entry


@router.delete("/{mood_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mood(mood_id: uuid.UUID, user: CurrentUser, session: DbSession):
    entry = await session.scalar(
        select(MoodEntry).where(MoodEntry.id == mood_id, MoodEntry.user_id == user.id)
    )
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Check-in not found.")
    await session.delete(entry)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
