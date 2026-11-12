import { delay, http, HttpResponse } from "msw";
import { HttpStatusCode } from "axios";
import { db, DEMO_PASSWORD, options, seedUser, toCard } from "@/tests/mocks/db";
import type { ILoginForm } from "@/schemas/auth-schema";
import type { IMatchRequest } from "@/schemas/match-schema";
import type { IOption, ISpecialistUpdate } from "@/schemas/specialist-schema";

// Mirrors the backend contract in backend/README.md. `delay()` simulates
// network latency in the browser and is a no-op in Node, so tests stay fast.
// The `*` prefix matches any origin (VITE_APP_API_URL).

const apiError = (status: number, title: string) => HttpResponse.json({ status, title }, { status });

const unauthorized = () => apiError(HttpStatusCode.Unauthorized, "UNAUTHORIZED");

const notFound = () => apiError(HttpStatusCode.NotFound, "SPECIALIST_NOT_FOUND");

const pick = (list: IOption[], ids: string[]) => list.filter((option) => ids.includes(option.id));

export const MOCK_REPLY = "Based on what you shared, these specialists could be a good fit.";

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

  // ---- match --------------------------------------------------------------
  // The real backend fuzzy-matches names; the mock matches substrings.
  http.post("*/api/match/associate", async ({ request }) => {
    await delay();
    if (!db.user) return unauthorized();
    const { name } = (await request.json()) as { name: string };
    const query = name.trim().toLowerCase();
    const specialists = db.specialists.filter((s) => s.name.toLowerCase().includes(query)).map(toCard);
    return HttpResponse.json({ specialists });
  }),

  // A scripted assistant that recommends specialists matching the child/youth answer.
  http.post("*/api/match", async ({ request }) => {
    await delay(800);
    if (!db.user) return unauthorized();
    const { forChildYouth } = (await request.json()) as IMatchRequest;
    const specialists = db.specialists
      .filter((s) => !forChildYouth || s.areasPractice.some((area) => area.name === "Children and Youth"))
      .map(toCard);
    return HttpResponse.json({ reply: MOCK_REPLY, specialists });
  }),

  // ---- specialists --------------------------------------------------------
  http.get("*/api/specialists", async () => {
    await delay();
    if (!db.user) return unauthorized();
    const list = db.specialists.map(({ id, name, role, photoUrl }) => ({ id, name, role: role.name, photoUrl }));
    return HttpResponse.json(list.sort((a, b) => a.name.localeCompare(b.name)));
  }),

  http.get("*/api/specialists/options", async () => {
    await delay();
    return db.user ? HttpResponse.json(options) : unauthorized();
  }),

  http.get("*/api/specialists/:id", async ({ params }) => {
    await delay();
    if (!db.user) return unauthorized();
    const specialist = db.specialists.find((s) => s.id === params.id);
    return specialist ? HttpResponse.json(specialist) : notFound();
  }),

  http.put("*/api/specialists/:id", async ({ params, request }) => {
    await delay();
    if (!db.user) return unauthorized();
    const specialist = db.specialists.find((s) => s.id === params.id);
    if (!specialist) return notFound();
    const form = (await request.json()) as ISpecialistUpdate;
    Object.assign(specialist, {
      name: form.name,
      role: options.roles.find((role) => role.id === form.roleId),
      description: form.description,
      bookingUrl: form.bookingUrl,
      profileUrl: form.profileUrl,
      photoUrl: form.photoUrl,
      sessionFormats: pick(options.sessionFormats, form.sessionFormatIds),
      areasPractice: pick(options.areasPractice, form.areasPracticeIds),
      credentials: pick(options.credentials, form.credentialIds),
    });
    return HttpResponse.json(specialist);
  }),
];
