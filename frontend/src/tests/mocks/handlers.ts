import { delay, http, HttpResponse } from "msw";
import { HttpStatusCode } from "axios";
import { db, DEMO_PASSWORD, newSession, seedUser } from "@/tests/mocks/db";
import type { ILoginForm } from "@/schemas/auth-schema";
import type { IIntakeState, ISession } from "@/schemas/intake-schema";

// Mirrors the backend contract in backend/README.md. `delay()` simulates
// network latency in the browser and is a no-op in Node, so tests stay fast.
// The `*` prefix matches any origin (VITE_APP_API_URL).

const apiError = (status: number, title: string) => HttpResponse.json({ status, title }, { status });

const unauthorized = () => apiError(HttpStatusCode.Unauthorized, "UNAUTHORIZED");

export function stateOf(session: ISession): IIntakeState {
  const state: Partial<ISession> = { ...session };
  delete state.messages;
  return state as IIntakeState;
}

export const handlers = [
  // ---- auth ---------------------------------------------------------------
  http.post("*/api/auth/login", async ({ request }) => {
    await delay();
    const { username, password } = (await request.json()) as ILoginForm;
    if (username !== seedUser.username || password !== DEMO_PASSWORD) {
      return apiError(HttpStatusCode.Unauthorized, "INVALID_CREDENTIALS");
    }
    db.user = { ...seedUser };
    return HttpResponse.json(db.user);
  }),

  http.get("*/api/auth/me", async () => {
    await delay();
    return db.user ? HttpResponse.json(db.user) : unauthorized();
  }),

  http.post("*/api/auth/logout", async () => {
    await delay();
    db.user = null;
    return new HttpResponse(null, { status: HttpStatusCode.NoContent });
  }),

  // ---- session ------------------------------------------------------------
  http.get("*/api/session", async () => {
    await delay();
    if (!db.user) return unauthorized();
    return db.session ? HttpResponse.json(db.session) : apiError(HttpStatusCode.NotFound, "SESSION_NOT_FOUND");
  }),

  http.post("*/api/session", async () => {
    await delay();
    if (!db.user) return unauthorized();
    db.session = newSession();
    return HttpResponse.json(db.session, { status: HttpStatusCode.Created });
  }),

  // A scripted assistant: it acknowledges every message and changes no fields.
  // Tests override this handler with server.use() to drive the intake.
  http.post("*/api/session/messages", async ({ request }) => {
    await delay(800);
    if (!db.session) return apiError(HttpStatusCode.NotFound, "SESSION_NOT_FOUND");
    const { text } = (await request.json()) as { text: string };
    const reply = "Thanks! Can you tell me a bit more?";
    db.session.messages.push({ role: "user", content: text }, { role: "assistant", content: reply });
    return HttpResponse.json({ reply, ...stateOf(db.session) });
  }),

  http.post("*/api/session/submit", async ({ request }) => {
    await delay();
    if (!db.session) return apiError(HttpStatusCode.NotFound, "SESSION_NOT_FOUND");
    if (!db.session.complete) return apiError(HttpStatusCode.Conflict, "INTAKE_INCOMPLETE");
    const { summary } = (await request.json()) as { summary: string };
    Object.assign(db.session, { status: "submitted", summary, ticketNumber: "DEMO-4821" });
    return HttpResponse.json(stateOf(db.session));
  }),
];
