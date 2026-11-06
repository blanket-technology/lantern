import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

RiskLevel = Literal["none", "elevated", "crisis"]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- auth ----------
class RegisterIn(BaseModel):
    email: EmailStr
    display_name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("display_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be blank")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(ORM):
    id: uuid.UUID
    email: EmailStr
    display_name: str
    created_at: datetime


class UserUpdate(BaseModel):
    display_name: str = Field(min_length=1, max_length=80)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- chat ----------
class MessageOut(ORM):
    id: uuid.UUID
    role: Literal["user", "assistant"]
    content: str
    risk_level: RiskLevel
    created_at: datetime


class ConversationOut(ORM):
    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime


class ConversationDetail(ConversationOut):
    messages: list[MessageOut]


class ConversationCreate(BaseModel):
    title: str | None = Field(default=None, max_length=120)


class ConversationUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=120)


class MessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=4000)

    @field_validator("content")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be blank")
        return v


# ---------- mood ----------
class MoodIn(BaseModel):
    score: int = Field(ge=1, le=5)
    tags: list[str] = Field(default_factory=list, max_length=8)
    note: str | None = Field(default=None, max_length=1000)

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, v: list[str]) -> list[str]:
        seen: list[str] = []
        for t in v:
            t = t.strip().lower()[:24]
            if t and t not in seen:
                seen.append(t)
        return seen


class MoodOut(ORM):
    id: uuid.UUID
    score: int
    tags: list[str]
    note: str | None
    created_at: datetime


# ---------- resources ----------
class Helpline(BaseModel):
    name: str
    phone: str
    hours: str
    description: str
    url: str | None = None
