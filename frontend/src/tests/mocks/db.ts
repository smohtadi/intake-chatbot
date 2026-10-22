import type { IAuthUser } from "@/schemas/auth-schema";
import type { ISession } from "@/schemas/intake-schema";

// In-memory backend shared by the MSW handlers (tests and browser mocking).
// Tests call resetDb() after each case; in the browser it resets on reload.

export const seedUser: IAuthUser = { username: "demo" };
export const DEMO_PASSWORD = "demo-password";
export const GREETING = "Hi! I'm the IT intake assistant. What's going wrong?";

export function newSession(): ISession {
  return {
    status: "collecting",
    messages: [{ role: "assistant", content: GREETING }],
    data: {},
    declined: [],
    missing: ["fullName", "email", "department", "issueCategory", "issueDescription", "startedAt", "impact", "canStillWork"],
    priority: null,
    complete: false,
  };
}

interface IDb {
  // null means "no session": GET /me answers 401.
  user: IAuthUser | null;
  // null means the user has no intake yet: GET /api/session answers 404.
  session: ISession | null;
}

export const db: IDb = {
  user: null,
  session: null,
};

export function resetDb() {
  db.user = { ...seedUser };
  db.session = null;
}

resetDb();
