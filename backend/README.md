# IT Intake Chatbot — API

Express 5 + TypeScript API for the IT intake demo. A chatbot collects IT support details through conversation, the server tracks which fields are still missing, and a fixed template turns the validated data into an editable ticket summary. See [`../docs/system-design.md`](../docs/system-design.md) for the full spec.

All data is fictional. Sessions live in memory and are lost on restart.

## Components

- **Auth:** one user from env vars. The password is checked with `crypto.scrypt`. A successful login gets a random token in an httpOnly, `SameSite=Strict` cookie, valid for 8 hours. Logout revokes the token. Failed logins are rate-limited to 5 per 15 minutes per IP.
- **Session:** each user has at most one intake session (`/api/session`), and creating a new one replaces the previous one. Idle sessions are deleted after 2 hours.
- **Intake turn:** each user message makes exactly one LLM call with one forced tool, `respond`, which returns `{ reply, fields, declined }`. Every field is validated on its own with Zod. The user message and the reply are recorded only after the call succeeds.
- **Summary:** a plain-text template over validated data. It never comes from the LLM.
- **LLM:** Anthropic (`claude-haiku-5-5` by default) behind the `LLMClient` interface, which is mocked in tests.

## Prerequisites

- Node.js 24+
- npm 11+
- An Anthropic API key (not needed for tests)

## Install and run

```bash
npm ci
cp .env.example .env
npm run hash-password -- 'your-demo-password'   # paste the output into DEMO_PASSWORD_HASH
# then set ANTHROPIC_API_KEY in .env
npm run dev                                      # http://localhost:3000/health
```

Run the frontend's `npm run dev` alongside this. Vite proxies `/api` to port 3000.

**Production:** build the frontend first, then:

```bash
npm run build
STATIC_DIR=../frontend/dist NODE_ENV=production npm start
```

This serves the frontend and the API from one origin. Run exactly one instance, because state is in memory. To deploy on Render, see [`../docs/deployment.md`](../docs/deployment.md).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled app |
| `npm test` | Run all tests once (the LLM is mocked; no API key needed) |
| `npm run test:coverage` | Tests plus the 80% coverage gate |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm run hash-password -- <password>` | Print a `DEMO_PASSWORD_HASH` value |

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DEMO_USERNAME` | yes | The one allowed username |
| `DEMO_PASSWORD_HASH` | yes | `scrypt$<salt>$<hash>` from `npm run hash-password` |
| `ANTHROPIC_API_KEY` | yes | Anthropic API key |
| `LLM_MODEL` | no | Defaults to `claude-haiku-5-5` |
| `STATIC_DIR` | no | Serve the frontend build from this folder |
| `TRUST_PROXY` | no | Proxy hops in front of the app; `1` on Render. Defaults to `0` |
| `PORT` | no | Defaults to `3000` |
| `NODE_ENV` | no | `production` enables `secure` cookies |

## API

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | `{ username, password }` | `200 { username }` + cookie, `401`, `429` |
| POST | `/api/auth/logout` | none | `204` |
| GET | `/api/auth/me` | none | `200 { username }` or `401` |
| POST | `/api/session` | none | `201 { messages, ...state }` |
| GET | `/api/session` | none | `200 { messages, ...state }` or `404` |
| POST | `/api/session/messages` | `{ text }` (max 1,000 chars) | `200 { reply, ...state }`, `409`, `502` |
| POST | `/api/session/submit` | `{ summary }` | `200 { ticketNumber, ...state }` or `409` |

`state` is `{ status, data, declined, missing, priority, complete, summary?, ticketNumber? }`. Errors use `{ status, title, errors? }`.

## Project structure

```
src/
  index.ts             # listen, cleanup timer, graceful shutdown
  app.ts               # helmet, logger, JSON limit, routers, static files, error handler
  config.ts            # env vars validated with Zod
  auth/                # login/logout/me, requireAuth, scrypt password helpers
  session/             # /api/session routes, session store, submit, cleanup
  intake/
    intake-schema.ts   # Zod fields, hints, requiredFields, missingFields, computePriority
    intake-prompt.ts   # system prompt and the respond tool
    intake-turn.ts     # runTurn: one LLM call, per-field validation, completion rules
    intake-summary.ts  # fixed summary template
  llm/                 # LLMClient interface and Anthropic adapter
  shared/              # in-memory db, errors, validate/notFound/errorHandler/requestLogger
scripts/hash-password.ts
tests/                 # setup, login helper, cross-cutting app tests
```

Requests flow `routes → validate → middleware → controller → service`. Errors thrown anywhere reach `errorHandler`.

## Testing

Route tests use supertest against `createApp()`, with the Anthropic adapter mocked through `vi.mock`. Intake logic (required fields, priority, turn merging, summary) has unit tests. `tests/setup.ts` resets the in-memory store before each test.
