import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.routers import auth, conversations, moods, resources

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(
    title=f"{settings.app_name} API",
    version="1.0.0",
    description="Backend for Lantern, an AI companion for emotional support.",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def readable_validation_error(_: Request, exc: RequestValidationError):
    """Turn Pydantic's error list into one sentence the UI can show as-is."""
    first = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(p) for p in first.get("loc", []) if p not in ("body", "query"))
    msg = first.get("msg", "Invalid request").removeprefix("Value error, ")
    detail = f"{field.replace('_', ' ').capitalize()}: {msg}" if field else msg
    return JSONResponse(status_code=422, content={"detail": detail})


for r in (auth.router, conversations.router, moods.router, resources.router):
    app.include_router(r, prefix="/api")


@app.get("/api/health", tags=["health"])
async def health():
    db_ok = True
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "up" if db_ok else "down",
        "ai_mode": "model" if settings.llm_enabled else "offline",
        "model": settings.llm_model if settings.llm_enabled else None,
    }
