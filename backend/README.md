# Psychology Centre Assistant — API

Express 5 + TypeScript API for a demo chatbot that helps visitors to a psychology centre's website find a specialist and book with them on Jane App. It also exposes a small admin API to list and edit the specialists. See [`../docs/system-design.md`](../docs/system-design.md) for the full spec.

All specialist data is fictional. Booking and profile links are seeded as `#`, a placeholder the API accepts alongside http(s) URLs.

## Components

- **Auth:** one demo user from env vars. The password is checked with `crypto.scrypt`, and a random token goes in an httpOnly, `SameSite=Strict` cookie that lasts 8 hours. Failed logins are limited to 5 per 15 minutes per IP. Tokens live in memory.
- **Specialists (`/api/specialists`):** list, read and update. Data is normalised in PostgreSQL: `specialist`, the lookup tables `role`, `session_format`, `areas_practice` and `credentials`, and three join tables. An update replaces the join rows in one transaction, then re-embeds the specialist.
- **Associate lookup (`/api/match/associate`):** [Fuse.js](https://www.fusejs.io/) fuzzy-matches a typed name against the roster, so "Jon" finds "John Whitaker". It involves no LLM.
- **Match (`/api/match`):** stateless. The client sends the whole thread every time, and nothing is stored on the server.
  1. A crisis check returns a fixed reply with 9-8-8, 911 and the front desk number, and makes no AI calls.
  2. The text is sanitised, then [`@redactpii/node`](https://www.npmjs.com/package/@redactpii/node) redacts emails, phone numbers, card numbers, SIN/SSN, dates and postal codes.
  3. Voyage AI embeds the redacted text, and pgvector picks the 6 closest specialists. When `forChildYouth` is set, only those with the "Children and Youth" area are considered.
  4. LangChain (`ChatAnthropic.withStructuredOutput`) gets a strict system prompt plus the exact clinic data for those specialists, and returns `{ reply, specialistIds }`.
  5. The server keeps only IDs it supplied and builds the cards (names and links) from the database, so the LLM can't invent a specialist or a URL.
- **Embeddings:** `voyage-3.5-lite` (1024 dimensions). On startup, any specialist with a NULL embedding is embedded, which covers the seed rows. If Voyage fails during an edit, the edit is still saved and the embedding is retried on the next start.
- **Abuse limits:** `/api/match*` allows 20 requests per 10 minutes per IP. A thread holds at most 20 messages of up to 1,000 characters each, and a JSON body at most 32 kB.

## Prerequisites

- Node.js 24+, npm 11+
- Docker, for the local database and for tests (testcontainers)
- An Anthropic API key and a Voyage AI API key (not needed for tests)

## Install and run

```bash
docker compose up -d                              # from the repo root: pgvector on :5432
npm ci
cp .env.example .env
npm run hash-password -- 'your-demo-password'     # paste the output into DEMO_PASSWORD_HASH
# then set ANTHROPIC_API_KEY and VOYAGE_API_KEY in .env
npm run dev                                       # http://localhost:3000/health
```

Migrations in `migrations/` run on startup, including the seed in `002_seed.sql`. Run the frontend's `npm run dev` alongside this; Vite proxies `/api` to port 3000. To deploy on Render, see [`../docs/deployment.md`](../docs/deployment.md).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` / `npm start` | Compile to `dist/` / run it |
| `npm test` | Run all tests once against a throwaway pgvector container (AI is mocked) |
| `npm run test:coverage` | Tests plus the 80% coverage gate |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm run hash-password -- <password>` | Print a `DEMO_PASSWORD_HASH` value |

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL with the `vector` extension available |
| `DEMO_USERNAME` | yes | The one allowed username |
| `DEMO_PASSWORD_HASH` | yes | `scrypt$<salt>$<hash>` from `npm run hash-password` |
| `ANTHROPIC_API_KEY` | yes | Anthropic API key |
| `VOYAGE_API_KEY` | yes | Voyage AI API key |
| `LLM_MODEL` | no | Defaults to `claude-haiku-5-5` |
| `EMBEDDING_MODEL` | no | Defaults to `voyage-3.5-lite`; must output 1024 dimensions |
| `FRONT_DESK_PHONE` | no | Shown in fallback and crisis replies. Defaults to a placeholder |
| `STATIC_DIR` | no | Serve the frontend build from this folder |
| `TRUST_PROXY` | no | Proxy hops in front of the app; `1` on Render |
| `PORT`, `NODE_ENV` | no | Defaults `3000`, `development`. `production` enables `secure` cookies |

## API

All `/api/match` and `/api/specialists` routes need the auth cookie.

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | `{ username, password }` | `200 { username }` + cookie, `401`, `429` |
| POST | `/api/auth/logout` | none | `204` |
| GET | `/api/auth/me` | none | `200 { username }` or `401` |
| POST | `/api/match/associate` | `{ name }` (max 100) | `200 { specialists: Card[] }` (up to 5), `429` |
| POST | `/api/match` | `{ forChildYouth, messages: [{ role, content }] }` | `200 { reply, specialists: Card[] }`, `400`, `429`, `502 LLM_ERROR` |
| GET | `/api/specialists` | none | `200 [{ id, name, role, photoUrl }]` |
| GET | `/api/specialists/options` | none | `200 { roles, sessionFormats, areasPractice, credentials }` as `{ id, name }[]` |
| GET | `/api/specialists/:id` | none | `200 Specialist` or `404` |
| PUT | `/api/specialists/:id` | `{ name, roleId, description, bookingUrl, profileUrl, photoUrl?, sessionFormatIds, areasPracticeIds, credentialIds }` | `200 Specialist`, `400`, `404` |

- `Card` is `{ id, name, role, description, sessionFormats, areasPractice, credentials, bookingUrl, profileUrl }`, with every list given as names.
- `Specialist` has the same fields plus `photoUrl` (string or `null`), but `role` and the lists are `{ id, name }` objects. On PUT, an omitted or `null` `photoUrl` clears the photo.
- `messages` must start and end with a `user` message.
- Errors use `{ status, title, errors?: [{ path, message }] }`.

## Project structure

```
migrations/            # node-pg-migrate SQL: 001_schema, 002_seed, 003_specialist_photo, 004_placeholder_links
src/
  index.ts             # connect + migrate, embed missing specialists, listen, shutdown
  app.ts               # helmet, JSON limit, routers, static files, error handler
  config.ts            # env vars validated with Zod
  auth/                # login/logout/me, requireAuth, scrypt helpers
  specialist/          # list/options/get/update, embedding text, embedMissingSpecialists
  match/
    match-routes.ts    # rate limiter + routes
    match-service.ts   # findAssociates (Fuse.js), matchSpecialists (RAG pipeline)
    match-safety.ts    # sanitize, redactPii, isCrisis
    match-prompt.ts    # strict system prompt + structured-output schema
  shared/
    db.ts              # pg Pool, migrations, transaction, resetDb (the only driver-aware file)
    ai.ts              # the only LangChain/Voyage file: embedQuery, embedDocuments, chooseSpecialists
    errors/, middleware/
tests/                 # global-setup (pgvector testcontainer), setup, login helper, app tests
```

## Testing

`tests/global-setup.ts` starts one `pgvector/pgvector:pg17` container per run. `tests/setup.ts` migrates it and restores the seed before each test. Test files run one at a time because they share the database. Route tests use supertest against `createApp()` and mock `src/shared/ai.ts` with `vi.mock`, so no API keys are needed.
