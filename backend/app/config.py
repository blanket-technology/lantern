import re
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All runtime configuration comes from environment variables (or a .env file)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Lantern"
    environment: str = "development"

    # Database. Plain postgres:// URLs (Render, Railway, Neon, Supabase) are
    # converted to the async driver automatically.
    database_url: str = "postgresql+asyncpg://lantern:lantern@localhost:5432/lantern"

    # Auth
    jwt_secret: str = "change-me-in-production-use-a-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60 * 24 * 7  # one week

    # CORS: comma-separated list of allowed frontend origins
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    # Optional regex for extra origins, e.g. Vercel preview URLs:
    # ^https://lantern[a-z0-9-]*\.vercel\.app$
    cors_origin_regex: str = ""

    # LLM. Any OpenAI-compatible endpoint works: OpenAI, Groq, OpenRouter,
    # Together, or a local Ollama server (http://localhost:11434/v1).
    # Leave llm_api_key empty to run the built-in offline companion.
    llm_api_key: str = ""
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "llama-3.3-70b-versatile"
    llm_temperature: float = 0.7
    llm_max_tokens: int = 600
    llm_timeout_seconds: float = 60.0
    llm_force_enabled: bool = False  # set true for keyless endpoints like Ollama

    # How many previous messages are sent to the model as context
    history_window: int = 20

    @field_validator("database_url")
    @classmethod
    def normalise_db_url(cls, v: str) -> str:
        # Dashboard-pasted values often carry a trailing newline, which would
        # otherwise end up in the database name ("railway\n").
        v = v.strip()
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://"):]
        if v.startswith("postgresql://"):
            v = "postgresql+asyncpg://" + v[len("postgresql://"):]
        # asyncpg does not understand sslmode=require in the query string,
        # and rejects channel_binding (added to Neon connection strings).
        v = v.replace("sslmode=require", "ssl=require")
        v = re.sub(r"[?&]channel_binding=[^&]*", "", v)
        if "?" not in v and "&" in v:
            v = v.replace("&", "?", 1)
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def llm_enabled(self) -> bool:
        return bool(self.llm_api_key) or self.llm_force_enabled


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
