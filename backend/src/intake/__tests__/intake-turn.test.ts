import { describe, expect, it, vi } from "vitest";
import type { LLMClient } from "../../llm/llm-client";
import type { Intake } from "../intake-schema";
import { runTurn, type IntakeState } from "../intake-turn";

const llmReturning = (output: unknown) => {
  const callTool = vi.fn<LLMClient["callTool"]>().mockResolvedValue(output);
  return { llm: { callTool }, callTool };
};

const emptyState = (overrides: Partial<IntakeState> = {}): IntakeState => ({
  messages: [{ role: "assistant", content: "What's going wrong?" }],
  data: {},
  declined: [],
  rejected: [],
  optionalAsked: false,
  complete: false,
  ...overrides,
});

const allRequired: Partial<Intake> = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  department: "Finance",
  issueCategory: "network",
  issueDescription: "The Wi-Fi keeps dropping every few minutes.",
  startedAt: "Monday",
  impact: "just_me",
};

describe("runTurn", () => {
  it("merges valid fields and rejects invalid ones without dropping the rest", async () => {
    const { llm } = llmReturning({
      reply: "Thanks!",
      fields: { fullName: "Ada Lovelace", email: "not-an-email", unknownField: "x", department: null },
      declined: [],
    });
    const result = await runTurn(llm, emptyState(), "I'm Ada, email not-an-email");
    expect(result.reply).toBe("Thanks!");
    expect(result.data).toEqual({ fullName: "Ada Lovelace" });
    expect(result.rejected).toEqual([expect.stringMatching(/^email: /)]);
  });

  it("overwrites corrected values", async () => {
    const { llm } = llmReturning({ reply: "Updated.", fields: { email: "new@example.com" }, declined: [] });
    const result = await runTurn(llm, emptyState({ data: { email: "old@example.com" } }), "Actually new@example.com");
    expect(result.data.email).toBe("new@example.com");
  });

  it("keeps only declined fields that are required and still empty", async () => {
    const { llm } = llmReturning({ reply: "Okay.", fields: {}, declined: ["department", "fullName", "errorMessage", "bogus"] });
    const result = await runTurn(llm, emptyState({ data: { fullName: "Ada Lovelace" } }), "I won't say");
    expect(result.declined).toEqual(["department"]);
  });

  it("removes a field from declined once a value arrives", async () => {
    const { llm } = llmReturning({ reply: "Got it.", fields: { department: "Finance" }, declined: [] });
    const result = await runTurn(llm, emptyState({ declined: ["department"] }), "Fine, Finance");
    expect(result.declined).toEqual([]);
  });

  it("marks optional fields asked, but not complete, in the turn the last required field arrives", async () => {
    const { llm } = llmReturning({ reply: "Any error text?", fields: { canStillWork: true }, declined: [] });
    const result = await runTurn(llm, emptyState({ data: allRequired }), "Yes I can work");
    expect(result).toMatchObject({ optionalAsked: true, complete: false });
  });

  it("completes on the turn after optional fields were asked", async () => {
    const { llm } = llmReturning({ reply: "Summary is ready.", fields: {}, declined: [] });
    const state = emptyState({ data: { ...allRequired, canStillWork: true }, optionalAsked: true });
    expect((await runTurn(llm, state, "No, nothing else")).complete).toBe(true);
  });

  it("completes immediately when optional fields were already given", async () => {
    const { llm } = llmReturning({ reply: "Summary is ready.", fields: { canStillWork: true }, declined: [] });
    const state = emptyState({ data: { ...allRequired, errorMessage: "Err 42", stepsTried: "Rebooted" } });
    expect((await runTurn(llm, state, "Yes")).complete).toBe(true);
  });

  it("sends only recent messages, starting with a user message", async () => {
    const { llm, callTool } = llmReturning({ reply: "Ok", fields: {}, declined: [] });
    const messages = Array.from({ length: 30 }, (_, index) => ({
      role: index % 2 === 0 ? ("assistant" as const) : ("user" as const),
      content: `message ${index}`,
    }));
    await runTurn(llm, emptyState({ messages }), "latest");
    const sent = callTool.mock.calls[0]![0].messages;
    expect(sent[0]!.role).toBe("user");
    expect(sent.at(-1)).toEqual({ role: "user", content: "latest" });
    expect(sent.length).toBeLessThanOrEqual(11);
  });

  it("puts collected, missing and rejected values in the system prompt", async () => {
    const { llm, callTool } = llmReturning({ reply: "Ok", fields: {}, declined: [] });
    await runTurn(llm, emptyState({ data: { fullName: "Ada Lovelace" }, rejected: ["email: Invalid email"] }), "hi");
    const { system } = callTool.mock.calls[0]![0];
    expect(system).toContain('"fullName":"Ada Lovelace"');
    expect(system).toContain("- email: a contact email address");
    expect(system).toContain("email: Invalid email");
  });

  it("throws when the tool output has no reply", async () => {
    const { llm } = llmReturning({ fields: {} });
    await expect(runTurn(llm, emptyState(), "hi")).rejects.toThrow();
  });
});
