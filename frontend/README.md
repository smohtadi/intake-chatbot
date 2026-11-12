# Psychology Centre Assistant — Frontend

React + Vite app for the psychology centre demo.
- **Home (`/`):** a hero with six support tiles. Each tile's "Get started" opens the chat.
- **Chat widget (every page):** a floating "Find a specialist" button opens a chat modal. It asks three questions and shows matching specialists, each with a "Book on Jane" link and a profile link.
- **Our Team (`/team`):** photo cards for the roster. Each card opens the edit view.

See [`../docs/system-design.md`](../docs/system-design.md) for the spec and [`../backend/README.md`](../backend/README.md) for the API.

All data is fictional.

## Stack

React 19, React Router 7, Redux Toolkit Query over axios, react-hook-form + zod, CSS Modules with design tokens in `src/index.css`, and lucide-react icons. Tests use Vitest, Testing Library and MSW.

## Screens

- **`/login`:** username, password, and an inline error for wrong credentials.
- **Header nav** (signed in): "Home" and "Our Team", a "Book a call" button that opens the chat, the username and Log out.
- **`/` Home:** "Ready to feel better?" and six tiles (Individual, Children & Teens, Couples, Family, Assessment, Executive Coaching). Tiles use colour placeholders with an icon until real images exist. "Children & Teens" also answers the children/youth question with "Yes" when the chat reaches it.
- **Chat widget:** a native `<dialog>` opened with `showModal()` (focus trap, Escape closes it), bottom right on desktop and full screen on phones. Its state lives in the Redux `chat` slice, so the conversation survives closing the widget and changing pages, until a reload or the **Start over** icon (↺) next to the close button. There are no start-over quick replies, so the input stays open after each answer.
  1. "Do you prefer a specific associate?" The visitor can type a name or click **No preference**. Typos are tolerated. If anyone matches, the chat shows their cards and ends; the header's ↺ icon restarts it. Otherwise it continues.
  2. "Are you looking for counselling for children/youth?" with **Yes** and **No** buttons.
  3. "Briefly describe what you're looking for." This and every follow-up go to the LLM. The reply shows cards under it.
  - The thread lives only in component state and is sent in full with each request. Nothing is stored on the server.
  - LLM failures appear inline with **Retry**, which resends the same text. Text that looks like a card or ID number shows a warning, but isn't blocked.
- **`/team`:** a card per specialist with photo, name and role. Without a photo, the card shows their initials.
- **`/team/:id/edit`:** name, role (select), description, session format, areas of practice and credentials (checkbox groups, at least one each), booking URL, shareable profile URL and an optional photo URL. **Save** returns to Our Team.

## Project structure

```
src/
├── app/
│   ├── router.tsx           /login, protected layout (AppLayout + Outlet + ChatWidget) → /, /team, /team/:id/edit
│   ├── chat-widget/         floating button + dialog, connected to the chat slice
│   └── routes/
│       ├── home/            hero + support tiles
│       ├── specialists/     team route (cards), edit route
│       ├── login/, protected/, errors/, not-found/
├── features/
│   ├── match/               chat-pane, chat-choices, specialist-card, sensitive-data
│   └── specialists/         specialist-form (react-hook-form + zod), team-card
├── components/              ui primitives, layout (app-header with nav), logo
├── store/
│   ├── auth/                authApi, AuthProvider, useAuth
│   ├── match/               match-api (findAssociate, match), chat-slice (steps, thread, sendChatMessage thunk)
│   └── specialists/         getSpecialists, getSpecialistOptions, getSpecialist, updateSpecialist
├── schemas/                 auth, match (API types), specialist (API types + form schema)
├── config/, hooks/, lib/
└── tests/                   Vitest suites, MSW handlers + in-memory db mirroring the API
```

Imports flow one way: `app/routes` → `features` → `store` / `schemas` → `lib` / `config`. `components/ui` never imports domain code.

## Data flow

```
ChatWidget ── chat slice ── sendChatMessage thunk ── matchApi.findAssociate / match → /api/match
   └─ ChatPane, ChatChoices, SpecialistCard (props in, callbacks out)
HomeRoute, AppHeader "Book a call" ── dispatch(chatOpened)
TeamRoute / SpecialistEditRoute ── specialistApi (tags: item + LIST) → /api/specialists
   └─ SpecialistForm
```

- Chat requests use `skipErrorToast` and show their errors inline. The thunk resets each mutation after it settles, and ignores replies that arrive after **Start over**. Other non-401 errors are toasted by `api-client`.
- `updateSpecialist` invalidates the item and the list.
- A 401 from any call re-checks `/me`. If that fails too, `ProtectedRoute` redirects to `/login`.

## Install, run, test

```bash
npm ci
npm run dev      # http://localhost:5173, proxies /api to the backend on :3000
```

Start the backend too (see its README). To run without a backend, set `VITE_APP_ENABLE_API_MOCKING=true` in `.env` and run `npx msw init public` once. The mock user is `demo` / `demo-password`. The mock associate lookup matches substrings, and the mock assistant returns every specialist that fits the children/youth answer.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck and build to `dist/` (served by the backend via `STATIC_DIR`) |
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
