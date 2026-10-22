# IT Intake Chatbot — Frontend

React + Vite app for the IT intake demo. The user signs in, chats with an assistant that collects IT support details, watches a "Ticket details" sidebar fill in, then edits and submits a ticket summary. See [`../docs/system-design.md`](../docs/system-design.md) for the full spec and [`../backend/README.md`](../backend/README.md) for the API.

All data is fictional. A banner on every page says so.

## Stack

React 19, React Router 7, Redux Toolkit Query over axios, react-hook-form + zod for the login form, CSS Modules with design tokens in `src/index.css`, lucide-react icons. Tests use Vitest, Testing Library and MSW.

## Screens

- **`/login`:** username, password, inline error for wrong credentials. Signed-in users are redirected to `/`.
- **`/` (protected):** the chat pane (messages, typing indicator, input with Enter to send) beside the "Ticket details" sidebar (collected values, "Not provided" for declined fields, "not yet collected", and the priority badge). On narrow screens the sidebar moves under the chat.
  - When the intake is complete, the summary panel replaces the input. The summary is editable, with **Submit** and **Back to chat**. A fresh summary after Back to chat asks before replacing your edits.
  - Submit shows the `DEMO-` ticket number and a **Start new intake** button.
  - LLM failures appear in the chat with **Retry**, which resends the same text. Errors that can't be retried, such as the turn limit, offer **Start new intake**.
  - Messages that look like a card or 9-digit ID number show a warning but are not blocked.

## Project structure

```
src/
├── main.tsx                 Entry; starts the MSW browser worker when mocking is on.
├── index.css                Design tokens and global utilities.
├── app/
│   ├── App.tsx              Redux → AuthProvider → ToastRegion + Router.
│   ├── router.tsx           /login, / (ProtectedRoute → AppLayout → IntakeRoute), 404.
│   └── routes/
│       ├── login/           Login form; redirects once /me returns a user.
│       ├── intake/          Loads or starts the session, sends messages, submits; owns chat UI state.
│       ├── protected/       ProtectedRoute (auth gate with `fallback`).
│       ├── errors/, not-found/
├── features/intake/         Presentational: chat-pane, ticket-sidebar, summary-panel, priority-badge,
│                            sensitive-data (card/ID heuristic).
├── components/
│   ├── ui/                  button, card, badge, loader, toast, form primitives.
│   ├── layout/              app-layout, app-header (username + Log out).
│   ├── demo-banner/, logo/
├── store/
│   ├── auth/                authApi (/me, login, logout), AuthProvider, useAuth.
│   └── intake/intake-api.ts getSession, createSession, sendMessage, submit.
├── schemas/                 auth-schema (login form), intake-schema (API types, field labels).
├── config/                  site name, paths, env, api base URL.
├── hooks/use-logout.ts
├── lib/                     api-client (toasts, error titles → messages, 401 → auth event), event buses.
└── tests/                   Vitest suites, MSW handlers + in-memory db mirroring the API.
```

Imports flow one way: `app/routes` → `features` → `store` / `schemas` → `lib` / `config`. `components/ui` never imports domain code.

## Data flow

```
IntakeRoute ── useGetSessionQuery / mutations (store/intake/intake-api.ts)
   │             └─ axiosBaseQuery → lib/api-client → /api/session (proxied to the backend in dev)
   └─ ChatPane / TicketSidebar / SummaryPanel (props in, callbacks out)
```

- `GET /api/session` returning 404 means "no intake yet", so the route creates one.
- `sendMessage` writes the reply and new state into the `getSession` cache. `createSession` and `submit` invalidate it.
- `api-client` toasts non-401 errors. Requests made with `skipErrorToast` (session load, chat turns) show their errors inline instead.
- Auth: a 401 from any call re-checks `/me`. If that also fails, `ProtectedRoute` redirects to `/login`.

## Install, run, test

```bash
npm ci
npm run dev      # http://localhost:5173, proxies /api to the backend on :3000
```

Start the backend too (`cd ../backend && npm run dev`). To run without a backend, set `VITE_APP_ENABLE_API_MOCKING=true` in `.env` and run `npx msw init public` once. The mock user is `demo` / `demo-password`, and the mock assistant just acknowledges messages.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck and build to `dist/` (served by the backend via `STATIC_DIR`; see `../docs/deployment.md`) |
| `npm test` | Vitest single run (`npx vitest run src/tests/<file>` for one file) |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc -b` |

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_APP_API_URL` | empty | API origin. Leave empty to use the same origin and the dev proxy. |
| `VITE_APP_AUTH_API_PATH` | `/api/auth` | Auth endpoints prefix |
| `VITE_APP_ENABLE_API_MOCKING` | `false` | Answer API calls with MSW in the browser |

## Testing

Tests render routes with `renderWithProviders(ui, { route, path })` and mock HTTP only through MSW (`tests/mocks/handlers.ts` + `db.ts`, reset after each test). Override a handler for one test with `server.use(...)`. Keep `handlers.ts` in sync with the backend contract, because browser mocking uses the same file.
