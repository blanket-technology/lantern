import os
import uuid

# Point the app at a throwaway database and force offline mode before importing it.
os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://postgres@localhost:5432/lantern_test"
)
os.environ["LLM_API_KEY"] = ""
os.environ["LLM_FORCE_ENABLED"] = "false"

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.rate_limit import auth_limiter, message_limiter  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
async def _schema():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(autouse=True)
def _reset_limits():
    auth_limiter._hits.clear()
    message_limiter._hits.clear()


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture
async def auth_client(client):
    email = f"user-{uuid.uuid4().hex[:8]}@example.com"
    r = await client.post(
        "/api/auth/register",
        json={"email": email, "display_name": "Asha", "password": "a-strong-pass"},
    )
    assert r.status_code == 201, r.text
    client.headers["Authorization"] = f"Bearer {r.json()['access_token']}"
    return client
