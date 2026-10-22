# CLAUDE.md

See README.md first. *Project structure* maps every folder and *Data flow* shows how a request travels. The intake feature (`app/routes/intake`, `features/intake`, `store/intake`) is the reference implementation.

## Commands

- `npm test`: Vitest single run. `npx vitest run src/tests/<file>` runs one file.
- `npm run lint`, `npm run typecheck`, `npm run build`
- `npm run dev`: set `VITE_APP_ENABLE_API_MOCKING=true` in `.env` to run against MSW.

## Conventions

- **Layers:** routes own URL state, data fetching, mutations, toasts and navigation. Feature components are presentational (props in, callbacks out). `components/ui` never imports domain code.
- **Imports:** use the `@/` alias (`@/store/posts/post-api`).
- **Styling:** CSS Modules (`styles.module.css` next to the component) using the tokens in `src/index.css`. No inline colors; add a token instead.
- **Routes and links:** always go through `config/paths.tsx` (`paths.app.x.path` / `getHref()`). Never hard-code URLs.
- **Data:** one RTK Query api per feature in `store/<feature>/`, registered in `store/store.ts`. Use tags for cache invalidation.
- **Forms:** react-hook-form + zod, built from `components/ui/form` (`Form.Field` with `controlId` and `error`). Only validate fields the user can edit, so a save is never blocked by a value the user cannot fix. Shared messages are in `schemas/schema-errors.tsx`.
- **Errors:** `lib/api-client` already toasts non-401 errors. Route handlers `catch` only to stop navigation or to keep form input.
- **Auth:** stays workflow-agnostic. Keep `/me` + `AuthProvider` + `ProtectedRoute fallback` as the contract, and add login flows per project (see README "Auth").
- **Tests:**
  - Every feature gets tests in `src/tests/`.
  - Render with `renderWithProviders(ui, { route, path })`. Mock HTTP only through MSW (`tests/mocks/handlers.ts` + `db.ts`, which reset after each test).
  - Assert on visible text and roles, on `db` state for payloads, and on `getByTestId("location")` for navigation.
  - Override a handler for one test with `server.use(...)`.
- **Mocks:** keep `handlers.ts` in sync with the real API contract, since the browser dev mocking uses the same file.
