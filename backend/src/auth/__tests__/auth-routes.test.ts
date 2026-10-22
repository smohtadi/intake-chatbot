import request from "supertest";
import { describe, expect, it } from "vitest";
import { DEMO_CREDENTIALS, loginAgent } from "../../../tests/login-agent";
import { createApp } from "../../app";

describe("POST /api/auth/login", () => {
  it("sets an httpOnly strict cookie and returns the username", async () => {
    const res = await request(createApp()).post("/api/auth/login").send(DEMO_CREDENTIALS).expect(200);
    expect(res.body).toEqual({ username: "demo" });
    const cookie = res.headers["set-cookie"]?.[0] ?? "";
    expect(cookie).toMatch(/^token=[0-9a-f]{64};/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
  });

  it.each([
    ["wrong username", { username: "someone", password: DEMO_CREDENTIALS.password }],
    ["wrong password", { username: DEMO_CREDENTIALS.username, password: "nope" }],
  ])("returns the same 401 for a %s", async (_case, body) => {
    const res = await request(createApp()).post("/api/auth/login").send(body).expect(401);
    expect(res.body).toEqual({ status: 401, title: "INVALID_CREDENTIALS" });
  });

  it("returns 400 for a missing password", async () => {
    const res = await request(createApp()).post("/api/auth/login").send({ username: "demo" }).expect(400);
    expect(res.body.title).toBe("VALIDATION_ERROR");
  });

  it("rate limits after 5 failed attempts", async () => {
    const app = createApp();
    const badLogin = { username: "demo", password: "nope" };
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app).post("/api/auth/login").send(badLogin).expect(401);
    }
    const res = await request(app).post("/api/auth/login").send(badLogin).expect(429);
    expect(res.body).toEqual({ status: 429, title: "RATE_LIMITED" });
  });
});

describe("GET /api/auth/me", () => {
  it("returns the signed-in user", async () => {
    const agent = await loginAgent(createApp());
    const res = await agent.get("/api/auth/me").expect(200);
    expect(res.body).toEqual({ username: "demo" });
  });

  it("returns 401 without a cookie", async () => {
    const res = await request(createApp()).get("/api/auth/me").expect(401);
    expect(res.body).toEqual({ status: 401, title: "UNAUTHORIZED" });
  });

  it("returns 401 for an unknown token", async () => {
    await request(createApp()).get("/api/auth/me").set("Cookie", "token=abc").expect(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("revokes the token so it no longer works", async () => {
    const app = createApp();
    const loginRes = await request(app).post("/api/auth/login").send(DEMO_CREDENTIALS).expect(200);
    const cookie = loginRes.headers["set-cookie"]?.[0]?.split(";")[0] ?? "";

    const logoutRes = await request(app).post("/api/auth/logout").set("Cookie", cookie).expect(204);
    expect(logoutRes.headers["set-cookie"]?.[0]).toMatch(/^token=;/);
    await request(app).get("/api/auth/me").set("Cookie", cookie).expect(401);
  });

  it("succeeds without a cookie", async () => {
    await request(createApp()).post("/api/auth/logout").expect(204);
  });
});
