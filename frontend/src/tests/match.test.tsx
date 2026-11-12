import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { db } from "@/tests/mocks/db";
import { server } from "@/tests/mocks/server";
import { MOCK_REPLY } from "@/tests/mocks/handlers";
import { renderWithProviders } from "@/tests/test-utils";
import ChatWidget from "@/app/chat-widget/chat-widget";
import { QUESTIONS } from "@/store/match/chat-slice";
import { looksSensitive } from "@/features/match/sensitive-data";
import type { IMatchRequest } from "@/schemas/match-schema";

type User = ReturnType<typeof renderWithProviders>["user"];

async function renderChat() {
  const rendered = renderWithProviders(<ChatWidget />);
  await rendered.user.click(screen.getByRole("button", { name: "Find a specialist" }));
  return rendered;
}

async function sendMessage(user: User, text: string) {
  await user.type(screen.getByLabelText("Message"), text);
  await user.click(screen.getByRole("button", { name: "Send" }));
}

async function answerScriptedQuestions(user: User, forChildYouth: "Yes" | "No") {
  await user.click(screen.getByRole("button", { name: "No preference" }));
  await user.click(await screen.findByRole("button", { name: forChildYouth }));
  expect(await screen.findByText(QUESTIONS.describe)).toBeInTheDocument();
}

describe("match chat", () => {
  it("opens from the floating button and asks for a preferred associate first", async () => {
    const { user } = renderWithProviders(<ChatWidget />);
    expect(screen.queryByText(QUESTIONS.associate)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Find a specialist" }));
    const dialog = screen.getByRole("dialog", { name: "Find a specialist" });
    expect(within(dialog).getByText(QUESTIONS.associate)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "No preference" })).toBeInTheDocument();
  });

  it("keeps the conversation after closing and reopening", async () => {
    const { user } = await renderChat();
    await user.click(screen.getByRole("button", { name: "No preference" }));
    await user.click(screen.getByRole("button", { name: "Close chat" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Find a specialist" }));
    expect(screen.getByText(QUESTIONS.childYouth)).toBeInTheDocument();
  });

  it("shows the matching associate's links and asks nothing else", async () => {
    db.specialists[0].bookingUrl = "https://example-clinic.janeapp.com/#/staff_member/1";
    const { user } = await renderChat();
    await sendMessage(user, "John");
    const card = await screen.findByRole("article", { name: "John Whitaker" });
    const booking = within(card).getByRole("link", { name: "Book on Jane" });
    expect(booking).toHaveAttribute("href", "https://example-clinic.janeapp.com/#/staff_member/1");
    expect(booking).toHaveAttribute("target", "_blank");
    const profile = within(card).getByRole("link", { name: "View profile" });
    expect(profile).toHaveAttribute("href", "#");
    expect(profile).not.toHaveAttribute("target");
    await user.click(profile);
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    expect(screen.queryByText(QUESTIONS.childYouth)).toBeNull();
    expect(screen.queryByLabelText("Message")).toBeNull();
  });

  it("keeps the input open after a reply, with no start-over quick reply", async () => {
    const { user } = await renderChat();
    await answerScriptedQuestions(user, "No");
    await sendMessage(user, "Work stress");
    expect(await screen.findByText(MOCK_REPLY)).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "Start over" })).toHaveLength(1);
  });

  it("moves on to the next question when no associate matches", async () => {
    const { user } = await renderChat();
    await sendMessage(user, "Nobody");
    expect(await screen.findByText(/couldn't find an associate/)).toBeInTheDocument();
    expect(screen.getByText(QUESTIONS.childYouth)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
  });

  it("sends the whole thread with the children/youth answer and shows the cards", async () => {
    const requests: IMatchRequest[] = [];
    server.use(
      http.post("*/api/match", async ({ request }) => {
        requests.push((await request.json()) as IMatchRequest);
        return HttpResponse.json({ reply: `Reply ${requests.length}`, specialists: [] });
      }),
    );
    const { user } = await renderChat();
    await answerScriptedQuestions(user, "Yes");
    await sendMessage(user, "My daughter worries a lot");
    expect(await screen.findByText("Reply 1")).toBeInTheDocument();
    await sendMessage(user, "Is in-person possible?");
    expect(await screen.findByText("Reply 2")).toBeInTheDocument();

    expect(requests[1]).toEqual({
      forChildYouth: true,
      messages: [
        { role: "user", content: "My daughter worries a lot" },
        { role: "assistant", content: "Reply 1" },
        { role: "user", content: "Is in-person possible?" },
      ],
    });
  });

  it("renders recommended specialists under the reply", async () => {
    const { user } = await renderChat();
    await answerScriptedQuestions(user, "Yes");
    await sendMessage(user, "My son can't focus at school");
    expect(await screen.findByText(MOCK_REPLY)).toBeInTheDocument();
    const cards = screen.getByRole("list", { name: "Matching specialists" });
    expect(within(cards).getByRole("article", { name: "Priya Raman" })).toBeInTheDocument();
    expect(within(cards).queryByRole("article", { name: "John Whitaker" })).toBeNull();
  });

  it("shows an LLM error inline and retries the same message", async () => {
    let calls = 0;
    server.use(
      http.post("*/api/match", () => {
        calls += 1;
        return HttpResponse.json({ status: 502, title: "LLM_ERROR" }, { status: 502 });
      }),
    );
    const { user } = await renderChat();
    await answerScriptedQuestions(user, "No");
    await sendMessage(user, "Work stress");
    expect(await screen.findByRole("alert")).toHaveTextContent("The assistant is unavailable right now");

    server.use(http.post("*/api/match", () => HttpResponse.json({ reply: "Try Hannah.", specialists: [] })));
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Try Hannah.")).toBeInTheDocument();
    expect(screen.getAllByText("Work stress")).toHaveLength(1);
    expect(calls).toBe(1);
  });

  it("starts over from the first question", async () => {
    const { user } = await renderChat();
    await sendMessage(user, "Priya");
    await user.click(await screen.findByRole("button", { name: "Start over" }));
    expect(screen.queryByRole("article")).toBeNull();
    expect(screen.getByText(QUESTIONS.associate)).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
  });

  it("warns about card-like numbers without blocking", async () => {
    const { user } = await renderChat();
    await user.type(screen.getByLabelText("Message"), "my card 4111 1111 1111 1111");
    expect(screen.getByText(/looks like a card or ID number/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  });
});

describe("looksSensitive", () => {
  it.each(["4111 1111 1111 1111", "4111-1111-1111-1111", "123-45-6789", "123456789"])("flags %s", (text) => {
    expect(looksSensitive(text)).toBe(true);
  });

  it.each(["My son is 9", "We tried CBT in 2023"])("ignores %s", (text) => {
    expect(looksSensitive(text)).toBe(false);
  });
});
