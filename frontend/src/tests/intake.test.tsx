import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { stateOf } from "@/tests/mocks/handlers";
import { db, GREETING, newSession } from "@/tests/mocks/db";
import { renderWithProviders } from "@/tests/test-utils";
import IntakeRoute from "@/app/routes/intake/intake-route";
import { looksSensitive } from "@/features/intake/sensitive-data";
import type { IIntakeState } from "@/schemas/intake-schema";

const SUMMARY = "[P3] Account access: Outlook keeps asking for my password\n\nPriority\nP3";

const completeState: Partial<IIntakeState> = {
  data: { fullName: "Ada Lovelace", issueCategory: "account_access" },
  missing: [],
  priority: "P3",
  complete: true,
  summary: SUMMARY,
};

/** Replies to every message with `reply` and merges `state` into the session. */
function replyWith(reply: string, state: Partial<IIntakeState>) {
  server.use(
    http.post("*/api/session/messages", async ({ request }) => {
      const { text } = (await request.json()) as { text: string };
      const session = db.session!;
      Object.assign(session, state);
      session.messages.push({ role: "user", content: text }, { role: "assistant", content: reply });
      return HttpResponse.json({ reply, ...stateOf(session) });
    }),
  );
}

async function renderIntake() {
  const result = renderWithProviders(<IntakeRoute />);
  await screen.findByText(GREETING);
  return result;
}

async function sendMessage(user: Awaited<ReturnType<typeof renderIntake>>["user"], text: string) {
  await user.type(screen.getByLabelText("Message"), text);
  await user.click(screen.getByRole("button", { name: "Send" }));
}

describe("intake page", () => {
  it("starts a new intake with a greeting when none exists", async () => {
    await renderIntake();
    const sidebar = screen.getByRole("complementary", { name: "Ticket details" });
    expect(within(sidebar).getByText("Name")).toBeInTheDocument();
    expect(within(sidebar).getAllByText("not yet collected").length).toBeGreaterThan(0);
  });

  it("restores an existing intake", async () => {
    db.session = { ...newSession(), data: { fullName: "Ada Lovelace" } };
    await renderIntake();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("shows the reply and updates the sidebar", async () => {
    replyWith("Thanks Ada. Who is affected?", {
      data: { fullName: "Ada Lovelace", department: undefined, issueCategory: "network" },
      declined: ["department"],
      priority: null,
    });
    const { user } = await renderIntake();
    await sendMessage(user, "I'm Ada, the Wi-Fi is down");
    expect(await screen.findByText("Thanks Ada. Who is affected?")).toBeInTheDocument();
    expect(screen.getByText("I'm Ada, the Wi-Fi is down")).toBeInTheDocument();
    const sidebar = screen.getByRole("complementary", { name: "Ticket details" });
    expect(within(sidebar).getByText("Network")).toBeInTheDocument();
    expect(within(sidebar).getByText("Not provided")).toBeInTheDocument();
  });

  it("shows an LLM error inline and retries the same message", async () => {
    let calls = 0;
    server.use(
      http.post("*/api/session/messages", () => {
        calls += 1;
        return HttpResponse.json({ status: 502, title: "LLM_ERROR" }, { status: 502 });
      }),
    );
    const { user } = await renderIntake();
    await sendMessage(user, "Printer is jammed");
    expect(await screen.findByRole("alert")).toHaveTextContent("The assistant is unavailable right now");

    replyWith("Which printer?", {});
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Which printer?")).toBeInTheDocument();
    expect(screen.getAllByText("Printer is jammed")).toHaveLength(1);
    expect(calls).toBe(1);
  });

  it("offers a new intake when the turn limit is reached", async () => {
    server.use(
      http.post("*/api/session/messages", () =>
        HttpResponse.json({ status: 409, title: "TURN_LIMIT_REACHED" }, { status: 409 }),
      ),
    );
    const { user } = await renderIntake();
    await sendMessage(user, "hello");
    expect(await screen.findByRole("alert")).toHaveTextContent("message limit");
    expect(screen.getByRole("button", { name: "Start new intake" })).toBeInTheDocument();
  });

  it("warns about card-like numbers without blocking", async () => {
    const { user } = await renderIntake();
    await user.type(screen.getByLabelText("Message"), "my card 4111 1111 1111 1111");
    expect(screen.getByText(/looks like a card or ID number/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  });

  it("shows the summary when complete, then submits the edited text", async () => {
    replyWith("Thanks, your summary is ready.", completeState);
    const { user } = await renderIntake();
    await sendMessage(user, "No, nothing else");

    const summary = await screen.findByLabelText("Summary");
    expect(summary).toHaveValue(SUMMARY);
    expect(screen.queryByLabelText("Message")).toBeNull();

    await user.clear(summary);
    await user.type(summary, "Edited summary");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByText("DEMO-4821")).toBeInTheDocument();
    expect(db.session?.summary).toBe("Edited summary");
    expect(screen.getByLabelText("Summary")).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Start new intake" })).toBeInTheDocument();
  });

  it("goes back to chat and asks before replacing an edited summary", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    replyWith("Thanks, your summary is ready.", completeState);
    const { user } = await renderIntake();
    await sendMessage(user, "No");
    await user.type(await screen.findByLabelText("Summary"), " edited");

    await user.click(screen.getByRole("button", { name: "Back to chat" }));
    replyWith("Updated your email.", { ...completeState, summary: `${SUMMARY}\nnew` });
    await sendMessage(user, "My email is ada@example.com");

    expect(await screen.findByLabelText("Summary")).toHaveValue(`${SUMMARY}\nnew`);
    expect(confirm).toHaveBeenCalledOnce();
    confirm.mockRestore();
  });

  it("starts over after submitting", async () => {
    db.session = { ...newSession(), ...completeState, status: "submitted", ticketNumber: "DEMO-1234" };
    const { user } = renderWithProviders(<IntakeRoute />);
    await user.click(await screen.findByRole("button", { name: "Start new intake" }));
    expect(await screen.findByLabelText("Message")).toBeInTheDocument();
    expect(db.session?.status).toBe("collecting");
  });
});

describe("looksSensitive", () => {
  it.each(["4111 1111 1111 1111", "4111-1111-1111-1111", "123-45-6789", "123456789"])("flags %s", (text) => {
    expect(looksSensitive(text)).toBe(true);
  });

  it.each(["My laptop is a ThinkPad T14", "Error 0x80070005", "Call me at ext. 4412"])("ignores %s", (text) => {
    expect(looksSensitive(text)).toBe(false);
  });
});
