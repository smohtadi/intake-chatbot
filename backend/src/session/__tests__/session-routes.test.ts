import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loginAgent } from "../../../tests/login-agent";
import { createApp } from "../../app";
import { anthropicClient } from "../../llm/anthropic-client";
import { GREETING, MAX_TURNS } from "../session-service";

vi.mock("../../llm/anthropic-client", () => ({ anthropicClient: { callTool: vi.fn() } }));

const callTool = vi.mocked(anthropicClient.callTool);

const allRequiredFields = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  department: "Finance",
  issueCategory: "account_access",
  issueDescription: "Outlook keeps asking for my password since Monday.",
  startedAt: "Monday",
  impact: "just_me",
  canStillWork: true,
};

const reply = (text: string, fields: object = {}, declined: string[] = []) => ({ reply: text, fields, declined });

const startedSession = async () => {
  const agent = await loginAgent(createApp());
  await agent.post("/api/session").expect(201);
  return agent;
};

const completedSession = async () => {
  const agent = await startedSession();
  callTool.mockResolvedValueOnce(reply("Any error text or steps tried?", allRequiredFields));
  await agent.post("/api/session/messages").send({ text: "Everything at once" }).expect(200);
  callTool.mockResolvedValueOnce(reply("Thanks, your summary is ready."));
  await agent.post("/api/session/messages").send({ text: "No" }).expect(200);
  return agent;
};

beforeEach(() => {
  callTool.mockReset();
});

describe("auth on /api/session", () => {
  it("returns 401 without a cookie", async () => {
    await request(createApp()).post("/api/session").expect(401);
  });
});

describe("POST /api/session", () => {
  it("starts a session with a greeting", async () => {
    const agent = await loginAgent(createApp());
    const res = await agent.post("/api/session").expect(201);
    expect(res.body).toMatchObject({
      messages: [{ role: "assistant", content: GREETING }],
      status: "collecting",
      data: {},
      declined: [],
      priority: null,
      complete: false,
    });
    expect(res.body.missing).toContain("fullName");
  });

  it("replaces the previous session", async () => {
    const agent = await startedSession();
    callTool.mockResolvedValueOnce(reply("Hi Ada", { fullName: "Ada Lovelace" }));
    await agent.post("/api/session/messages").send({ text: "I'm Ada" }).expect(200);
    await agent.post("/api/session").expect(201);
    const res = await agent.get("/api/session").expect(200);
    expect(res.body.data).toEqual({});
  });
});

describe("GET /api/session", () => {
  it("returns 404 when no session exists", async () => {
    const agent = await loginAgent(createApp());
    const res = await agent.get("/api/session").expect(404);
    expect(res.body.title).toBe("SESSION_NOT_FOUND");
  });

  it("restores messages and state", async () => {
    const agent = await startedSession();
    callTool.mockResolvedValueOnce(reply("Thanks Ada, what's your email?", { fullName: "Ada Lovelace" }));
    await agent.post("/api/session/messages").send({ text: "I'm Ada" }).expect(200);
    const res = await agent.get("/api/session").expect(200);
    expect(res.body.messages).toHaveLength(3);
    expect(res.body.data).toEqual({ fullName: "Ada Lovelace" });
  });
});

describe("POST /api/session/messages", () => {
  it("returns the reply and the updated state", async () => {
    const agent = await startedSession();
    callTool.mockResolvedValueOnce(reply("Got it.", { impact: "whole_office", canStillWork: false, issueCategory: "network" }));
    const res = await agent.post("/api/session/messages").send({ text: "Wi-Fi is down for everyone" }).expect(200);
    expect(res.body).toMatchObject({ reply: "Got it.", priority: "P1", complete: false });
    expect(res.body.summary).toBeUndefined();
  });

  it("returns the template summary once complete", async () => {
    const agent = await completedSession();
    const res = await agent.get("/api/session").expect(200);
    expect(res.body).toMatchObject({ complete: true, priority: "P3" });
    expect(res.body.summary).toMatch(/^\[P3\] Account access: Outlook keeps asking/);
  });

  it("returns 400 for empty or too long text", async () => {
    const agent = await startedSession();
    await agent.post("/api/session/messages").send({ text: "   " }).expect(400);
    await agent.post("/api/session/messages").send({ text: "x".repeat(1001) }).expect(400);
  });

  it("returns 404 without a session", async () => {
    const agent = await loginAgent(createApp());
    await agent.post("/api/session/messages").send({ text: "hello" }).expect(404);
  });

  it("returns 502 on LLM failure without recording the message", async () => {
    const agent = await startedSession();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    callTool.mockRejectedValueOnce(new Error("upstream down"));
    const res = await agent.post("/api/session/messages").send({ text: "hello" }).expect(502);
    expect(res.body).toEqual({ status: 502, title: "LLM_ERROR" });
    expect((await agent.get("/api/session")).body.messages).toHaveLength(1);
    consoleError.mockRestore();
  });

  it("returns 409 while another turn is in flight", async () => {
    const agent = await startedSession();
    let finishTurn: (value: unknown) => void = () => {};
    callTool.mockReturnValueOnce(new Promise((resolve) => (finishTurn = resolve)));
    const firstTurn = agent.post("/api/session/messages").send({ text: "first" }).then((res) => res);
    await vi.waitFor(() => expect(callTool).toHaveBeenCalled());
    const res = await agent.post("/api/session/messages").send({ text: "second" }).expect(409);
    expect(res.body.title).toBe("TURN_IN_PROGRESS");
    finishTurn(reply("Ok"));
    expect((await firstTurn).status).toBe(200);
  });

  it(`returns 409 after ${MAX_TURNS} turns`, async () => {
    const agent = await startedSession();
    callTool.mockResolvedValue(reply("Ok"));
    for (let turn = 0; turn < MAX_TURNS; turn += 1) {
      await agent.post("/api/session/messages").send({ text: "hi" }).expect(200);
    }
    const res = await agent.post("/api/session/messages").send({ text: "hi" }).expect(409);
    expect(res.body.title).toBe("TURN_LIMIT_REACHED");
  });
});

describe("POST /api/session/submit", () => {
  it("returns 409 when the intake is incomplete", async () => {
    const agent = await startedSession();
    const res = await agent.post("/api/session/submit").send({ summary: "Draft" }).expect(409);
    expect(res.body.title).toBe("INTAKE_INCOMPLETE");
  });

  it("stores the edited summary and returns a ticket number", async () => {
    const agent = await completedSession();
    const res = await agent.post("/api/session/submit").send({ summary: "Edited summary" }).expect(200);
    expect(res.body).toMatchObject({ status: "submitted", summary: "Edited summary" });
    expect(res.body.ticketNumber).toMatch(/^DEMO-\d{4}$/);
  });

  it("makes the session read-only after submit", async () => {
    const agent = await completedSession();
    await agent.post("/api/session/submit").send({ summary: "Edited summary" }).expect(200);
    const message = await agent.post("/api/session/messages").send({ text: "one more" }).expect(409);
    expect(message.body.title).toBe("ALREADY_SUBMITTED");
    await agent.post("/api/session/submit").send({ summary: "Again" }).expect(409);
  });

  it("returns 400 for an empty summary", async () => {
    const agent = await completedSession();
    await agent.post("/api/session/submit").send({ summary: "" }).expect(400);
  });
});
