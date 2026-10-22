import type { Express } from "express";
import request from "supertest";

export const DEMO_CREDENTIALS = { username: "demo", password: "test-password" };

/** A supertest agent that keeps the auth cookie from a successful login. */
export const loginAgent = async (app: Express) => {
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send(DEMO_CREDENTIALS).expect(200);
  return agent;
};
