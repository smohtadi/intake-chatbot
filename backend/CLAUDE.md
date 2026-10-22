# CLAUDE.md

Express 5 + TypeScript REST API. Feature-based layout, Zod validation, Vitest + supertest tests. See README.md for full docs.

## Commands

- `npm run dev`: start with hot reload
- `npm test`: run tests once (`npm run test:watch` for watch mode)
- `npm run test:coverage`: tests plus the 80% coverage gate (what CI runs)
- `npm run lint`, `npm run typecheck`, `npm run build`

Before finishing any change, run `npm run lint && npm run typecheck && npm test`. All three must pass.

## Architecture

Each feature lives in `src/<feature>/`, with files named `<feature>-<role>.ts` in kebab-case and singular (`session-service.ts`):

| File                      | Responsibility                                                                 |
| ------------------------- | ------------------------------------------------------------------------------ |
| `<feature>-routes.ts`     | Exports `<feature>Router`. Wires `validate(...)` → middleware → controller. No logic. |
| `<feature>-validator.ts`  | Zod schemas plus exported `z.infer` types. This is the single source of input types. |
| `<feature>-controller.ts` | HTTP only: reads parsed `req.params/query/body`, calls the service, maps the response through `toDto`. |
| `<feature>-service.ts`    | Business logic **and** data access. Throws `AppError` subclasses.              |
| `<feature>-middleware.ts` | Middleware specific to the feature (for example `loadSession` → `res.locals.session`). |
| `__tests__/*.test.ts`     | Route, service and validator tests.                                            |

Shared code is in `src/shared/` (`db.ts`, `errors/`, `middleware/`, `utils/`). Mount new routers in `src/app.ts`.

## Rules

- **No repository layer.** Services call the database directly. Don't add `*-repository.ts` files or generic data abstractions.
- **`src/shared/db.ts` is the only place that knows the database driver** (connect, disconnect and reset). The template default is in-memory.
- **Validate at the route** with `validate({ body, params, query })`. Type controller `Request` generics with the matching `z.infer` types. Don't re-validate in controllers.
- In Zod 4, `.partial()` keeps `.default()` values. Build update schemas from the raw fields, not from the create schema.
- **Errors:** throw `NotFoundError`, `BadRequestError` or a new `AppError` subclass from `src/shared/errors/`. Never send 4xx/5xx manually from controllers. Express 5 forwards async errors, so you don't need `try/catch` or an async wrapper.
- Error response shape: `{ status, title, errors?: [{ path, message }] }`.
- Don't return raw database documents. Always map them through `toDto` in the controller.
- Use type-only imports (`import type`); ESLint enforces this.
- Read env vars only through `src/config.ts`, never `process.env` elsewhere. Add new vars to the Zod schema and to `.env.example`.

## Testing

- Every new or changed endpoint needs route tests (`supertest` against `createApp()`) covering the success path, 400 validation and 404 where `:id` applies.
- Route tests must assert on HTTP behaviour only. Don't import or inspect the database in them, so they survive database changes.
- `tests/setup.ts` resets the database before each test. Don't share state between tests.
- Import `describe/it/expect/vi` from `vitest` (globals are off).

## Dependencies

- Dependabot opens weekly PRs. Minor and patch updates auto-merge after CI passes.
- TypeScript is pinned to `~6.0` to match `typescript-eslint`'s supported peer range. Don't bump it unless `typescript-eslint` supports the new version.
