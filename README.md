# Lantern

An AI companion for emotional support. People can talk through what they are feeling, log a daily mood check-in, follow a guided breathing exercise, and reach real helplines quickly. If a message suggests someone may be at risk, the app shows crisis numbers straight away.

**Stack:** React 19 + Vite, FastAPI (async), PostgreSQL 16, SQLAlchemy 2, Alembic, JWT auth. The AI model works with any OpenAI-compatible API (Groq, OpenAI, OpenRouter, Ollama).

> Lantern is a support tool, not a medical device or a crisis service. Read [Safety design](#safety-design) before you deploy it for real users.

---

## Features

- **Streaming chat.** Replies appear word by word over server-sent events. Conversations are saved, and you can rename or delete them.
- **Safety layer.** Every message is screened before it reaches the model. Crisis language triggers a helpline banner in the UI and stricter instructions for the model.
- **Works without an API key.** A built-in offline companion replies using reflective listening, so the app is fully usable in development and keeps working if the model provider goes down.
- **Mood check-ins.** A 5-point scale with tags and an optional note, a 30-day chart, average, streak, and the most frequent tag. If a whole week has been low, the app gently suggests support.
- **Guided breathing.** Three patterns (slow exhale, box, 4-7-8), animated with a glow that respects reduced-motion settings.
- **Support page.** Verified Indian helplines with tap-to-call, emergency number 112, and a grounding exercise. It is reachable without signing in.
- **Accounts.** Register, sign in, rename, and delete your account along with all its data.
- **Design.** Responsive from 320px up, light and dark themes, self-hosted fonts (no third-party requests), keyboard and screen-reader friendly.

## Project structure

```
lantern/
├── backend/
│   ├── app/
│   │   ├── main.py              FastAPI app, CORS, error handling, /api/health
│   │   ├── config.py            Settings from environment variables
│   │   ├── database.py          Async engine and session
│   │   ├── models.py            User, Conversation, Message, MoodEntry
│   │   ├── schemas.py           Pydantic request and response models
│   │   ├── security.py          bcrypt hashing, JWT
│   │   ├── deps.py              Current-user dependency
│   │   ├── rate_limit.py        Per-user and per-IP limits
│   │   ├── routers/             auth, conversations (SSE), moods, resources
│   │   └── services/
│   │       ├── safety.py        Risk screening
│   │       ├── prompts.py       System prompt and safety add-ons
│   │       ├── llm.py           Streaming client with fallback
│   │       ├── companion.py     Offline companion
│   │       └── resources.py     Helplines (edit for your country)
│   ├── alembic/                 Database migrations
│   ├── tests/                   31 tests (API, safety, LLM client)
│   ├── Dockerfile, entrypoint.sh
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.js        Fetch wrapper and SSE stream reader
│   │   ├── context/             Auth and conversation state
│   │   ├── components/          Shell, sidebar, composer, crisis banner, chart
│   │   ├── pages/               Landing, auth, chat, mood, breathe, support, account
│   │   └── styles/global.css    Design tokens and all styles
│   ├── nginx.conf, Dockerfile
│   └── package.json
├── docker-compose.yml
└── render.yaml
```

---

## Run it with Docker (quickest)

```bash
docker compose up --build
```

Open http://localhost:8080. API docs are at http://localhost:8000/api/docs.

This starts in offline-companion mode. To use a real model, create `backend/.env` from `backend/.env.example` and set `LLM_API_KEY`, or pass it inline:

```bash
LLM_API_KEY=gsk_your_key docker compose up --build
```

## Run it locally without Docker

You need Python 3.11+, Node 20+ and PostgreSQL 14+.

**1. Database**

```bash
createdb lantern
# or: psql -c "CREATE USER lantern WITH PASSWORD 'lantern'; CREATE DATABASE lantern OWNER lantern;"
```

**2. Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env               # edit DATABASE_URL and JWT_SECRET, add LLM_API_KEY if you have one
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**3. Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to port 8000, so you don't need any CORS setup in development.

## Getting a free AI key

[Groq](https://console.groq.com) has a free tier and is fast enough for streaming chat. Create a key and put it in `LLM_API_KEY`. The defaults in `.env.example` already point to Groq's `llama-3.3-70b-versatile`.

To run fully on your own machine, install [Ollama](https://ollama.com), pull a model, and set:

```
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.1
LLM_FORCE_ENABLED=true
```

The line under the chat input shows which mode is active: "AI model connected" or "Offline companion".

---

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | local postgres | `postgres://`, `postgresql://` or `postgresql+asyncpg://`. The first two are converted automatically. |
| `JWT_SECRET` | dev value | **Change in production.** `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `ACCESS_TOKEN_MINUTES` | `10080` | How long a sign-in lasts (default one week) |
| `CORS_ORIGINS` | localhost | Comma-separated frontend URLs allowed to call the API |
| `LLM_API_KEY` | empty | Empty means offline companion |
| `LLM_BASE_URL` | Groq | Any OpenAI-compatible `/v1` endpoint |
| `LLM_MODEL` | `llama-3.3-70b-versatile` | Model name for that provider |
| `LLM_TEMPERATURE` | `0.7` | |
| `LLM_MAX_TOKENS` | `600` | Max length of each reply |
| `LLM_FORCE_ENABLED` | `false` | Use the model without a key (Ollama) |
| `HISTORY_WINDOW` | `20` | Past messages sent to the model as context |
| `VITE_API_URL` (frontend, build time) | empty | Only needed when the API is on a different domain and not proxied |

---

## Deploying

### Option A: Render (one blueprint)

1. Push this folder to a GitHub repo.
2. In Render, choose **New > Blueprint** and select the repo. `render.yaml` creates the database, the API and the web service.
3. Once both services have URLs, set:
   - on **lantern-api**: `CORS_ORIGINS=https://<your-web>.onrender.com` and `LLM_API_KEY`
   - on **lantern-web**: `API_UPSTREAM=https://<your-api>.onrender.com`
4. Redeploy the web service. nginx proxies `/api` to the API, and streaming works because proxy buffering is turned off.

Migrations run automatically every time the API starts.

### Option B: Any VPS (DigitalOcean, AWS EC2, Hetzner)

```bash
git clone <your-repo> && cd lantern
export JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(48))")
export LLM_API_KEY=your_key
docker compose up -d --build
```

Put Caddy or nginx with HTTPS in front of port 8080, and update `CORS_ORIGINS` in `docker-compose.yml` to your domain.

### Option C: Split hosting (Vercel + Railway/Render + Neon/Supabase)

- **Database:** create a Postgres on Neon or Supabase and copy its connection string into `DATABASE_URL`. `sslmode=require` is handled.
- **API:** deploy `backend/` with its Dockerfile on Railway or Render.
- **Frontend:** deploy `frontend/` on Vercel with build command `npm run build`, output `dist`, and `VITE_API_URL=https://your-api-url`. Add a rewrite so client routes work: `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}` in `vercel.json`. Add the Vercel URL to `CORS_ORIGINS`.

---

## API

All routes are under `/api`. Interactive docs are at `/api/docs`.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create an account, returns a token and the user |
| POST | `/auth/login` | Sign in |
| GET / PATCH / DELETE | `/auth/me` | Get, rename, or delete your account and all its data |
| GET / POST | `/conversations` | List or create conversations |
| GET / PATCH / DELETE | `/conversations/{id}` | Read with messages, rename, delete |
| POST | `/conversations/{id}/messages` | Send a message and stream the reply (SSE) |
| GET / POST | `/moods?days=30` | List or add mood check-ins |
| DELETE | `/moods/{id}` | Delete a check-in |
| GET | `/resources/helplines` | Helplines and emergency number |
| GET | `/health` | Database status and AI mode |

**Streaming format.** `POST /conversations/{id}/messages` returns `text/event-stream` with these events in order:

```
event: meta   data: {"user_message": {...}, "risk_level": "none|elevated|crisis", "title": "..."}
event: token  data: {"text": "partial text"}      (repeated)
event: done   data: {"message": {...saved assistant message}}
```

---

## Safety design

1. **Screening before the model.** `services/safety.py` checks each message against crisis patterns (suicide, self-harm, wanting to die, and common romanised Hindi phrases) and distress patterns (hopelessness, panic). It is tuned to catch real risk even at the cost of some false alarms, and the tests check that phrases like "this deadline is killing me" are not flagged.
2. **Crisis response.** The UI shows the helpline banner immediately, before the reply arrives. The model gets an extra instruction to put safety first, ask whether the person is safe, and give the numbers. In offline mode, a fixed and carefully worded crisis reply is used.
3. **Guardrails in the prompt.** No diagnosis, no medication advice, no coping ideas that involve pain or mimic self-harm, no method information, and no encouraging the person to rely on the app instead of people.
4. **Failure handling.** If the model errors or times out, the offline companion answers, so the person is never met with silence.
5. **Privacy.** Every query is scoped to the signed-in user. Users can delete conversations, check-ins, or their whole account. Fonts are self-hosted so no third-party requests are made.

**Before a real launch:** have a clinician review the prompt and crisis copy, re-check the helpline numbers in `services/resources.py` (they were verified in October 2026), add a privacy policy, and consider encrypting message content at rest.

### Using it outside India

Edit `HELPLINES` and `EMERGENCY_NUMBER` in `backend/app/services/resources.py`, and the fallback list in `frontend/src/hooks/useHelplines.js`, which is shown if the API is unreachable.

---

## Tests

```bash
cd backend
createdb lantern_test
DATABASE_URL=postgresql+asyncpg://<user>@localhost:5432/lantern_test pytest
```

The 31 tests cover auth, privacy between users, conversation CRUD, the streaming endpoint end to end, crisis detection, mood tracking, account deletion, the OpenAI-compatible client (mocked), and fallback when the model fails.

## Known limits

- The rate limiter is in memory, so it only works for a single API instance. Move it to Redis if you scale out.
- Tokens are stored in `localStorage`. For higher-security deployments, switch to httpOnly cookies.
- The safety screen is keyword-based. It is a first line of defence, not a clinical risk assessment.
