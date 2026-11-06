import json


def parse_sse(raw: str) -> list[tuple[str, dict]]:
    events = []
    for block in raw.strip().split("\n\n"):
        event, data = "message", ""
        for line in block.splitlines():
            if line.startswith("event:"):
                event = line[6:].strip()
            elif line.startswith("data:"):
                data += line[5:].strip()
        events.append((event, json.loads(data)))
    return events


async def test_health(client):
    r = await client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["database"] == "up"
    assert body["ai_mode"] == "offline"


async def test_register_login_and_me(client):
    payload = {"email": "Meera@Example.com", "display_name": "Meera", "password": "longenough1"}
    r = await client.post("/api/auth/register", json=payload)
    assert r.status_code == 201
    assert r.json()["user"]["email"] == "meera@example.com"

    dup = await client.post("/api/auth/register", json=payload)
    assert dup.status_code == 409

    bad = await client.post("/api/auth/login", json={"email": "meera@example.com", "password": "nope"})
    assert bad.status_code == 401

    ok = await client.post("/api/auth/login", json={"email": "MEERA@example.com", "password": "longenough1"})
    assert ok.status_code == 200
    token = ok.json()["access_token"]

    me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["display_name"] == "Meera"


async def test_validation_message_is_readable(client):
    r = await client.post(
        "/api/auth/register", json={"email": "x@example.com", "display_name": "X", "password": "short"}
    )
    assert r.status_code == 422
    assert "Password" in r.json()["detail"]


async def test_protected_routes_need_token(client):
    assert (await client.get("/api/conversations")).status_code == 401
    bad = await client.get("/api/conversations", headers={"Authorization": "Bearer garbage"})
    assert bad.status_code == 401


async def test_chat_streams_and_persists(auth_client):
    convo = (await auth_client.post("/api/conversations", json={})).json()
    assert convo["title"] == "New conversation"

    r = await auth_client.post(
        f"/api/conversations/{convo['id']}/messages",
        json={"content": "I've been really anxious about my exams"},
    )
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/event-stream")
    events = parse_sse(r.text)
    kinds = [e for e, _ in events]
    assert kinds[0] == "meta" and kinds[-1] == "done" and "token" in kinds

    meta = events[0][1]
    assert meta["risk_level"] == "none"
    assert meta["title"].startswith("I've been really anxious")

    streamed = "".join(d["text"] for e, d in events if e == "token").strip()
    saved = events[-1][1]["message"]
    assert saved["role"] == "assistant" and saved["content"] == streamed

    detail = (await auth_client.get(f"/api/conversations/{convo['id']}")).json()
    assert [m["role"] for m in detail["messages"]] == ["user", "assistant"]


async def test_crisis_message_returns_helplines(auth_client):
    convo = (await auth_client.post("/api/conversations", json={})).json()
    r = await auth_client.post(
        f"/api/conversations/{convo['id']}/messages", json={"content": "I don't want to live anymore"}
    )
    events = parse_sse(r.text)
    assert events[0][1]["risk_level"] == "crisis"
    reply = events[-1][1]["message"]["content"]
    assert "14416" in reply and "112" in reply


async def test_conversations_are_private(auth_client, client):
    convo = (await auth_client.post("/api/conversations", json={"title": "Mine"})).json()

    # Second user cannot see or touch the first user's conversation.
    from httpx import ASGITransport, AsyncClient

    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as other:
        reg = await other.post(
            "/api/auth/register",
            json={"email": "other@example.com", "display_name": "Other", "password": "password123"},
        )
        other.headers["Authorization"] = f"Bearer {reg.json()['access_token']}"
        assert (await other.get(f"/api/conversations/{convo['id']}")).status_code == 404
        assert (await other.delete(f"/api/conversations/{convo['id']}")).status_code == 404


async def test_rename_and_delete_conversation(auth_client):
    convo = (await auth_client.post("/api/conversations", json={})).json()
    r = await auth_client.patch(f"/api/conversations/{convo['id']}", json={"title": "Sunday thoughts"})
    assert r.json()["title"] == "Sunday thoughts"
    assert (await auth_client.delete(f"/api/conversations/{convo['id']}")).status_code == 204
    assert (await auth_client.get(f"/api/conversations/{convo['id']}")).status_code == 404


async def test_mood_tracking(auth_client):
    r = await auth_client.post(
        "/api/moods", json={"score": 4, "tags": ["Sleep", "sleep", " work "], "note": "decent day"}
    )
    assert r.status_code == 201
    entry = r.json()
    assert entry["tags"] == ["sleep", "work"]

    assert (await auth_client.post("/api/moods", json={"score": 9})).status_code == 422

    listed = (await auth_client.get("/api/moods?days=7")).json()
    assert len(listed) == 1

    assert (await auth_client.delete(f"/api/moods/{entry['id']}")).status_code == 204
    assert (await auth_client.get("/api/moods")).json() == []


async def test_delete_account_removes_everything(auth_client):
    await auth_client.post("/api/conversations", json={})
    await auth_client.post("/api/moods", json={"score": 3})
    assert (await auth_client.delete("/api/auth/me")).status_code == 204
    assert (await auth_client.get("/api/auth/me")).status_code == 401


async def test_helplines(client):
    body = (await client.get("/api/resources/helplines")).json()
    assert body["emergency_number"] == "112"
    assert any(h["phone"] == "14416" for h in body["helplines"])
