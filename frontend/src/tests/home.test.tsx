import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/tests/test-utils";
import ChatWidget from "@/app/chat-widget/chat-widget";
import HomeRoute from "@/app/routes/home/home-route";
import { QUESTIONS } from "@/store/match/chat-slice";

function renderHome() {
  return renderWithProviders(
    <>
      <HomeRoute />
      <ChatWidget />
    </>,
  );
}

describe("home page", () => {
  it("shows a tile for each type of support", () => {
    renderHome();
    expect(screen.getByRole("heading", { name: "Ready to feel better?" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(6);
    expect(within(screen.getByRole("article", { name: "Assessment" })).getByText("ADHD & learning")).toBeInTheDocument();
  });

  it("opens the chat from a tile", async () => {
    const { user } = renderHome();
    const tile = screen.getByRole("article", { name: "Individual" });
    await user.click(within(tile).getByRole("button", { name: "Get started" }));
    expect(within(screen.getByRole("dialog")).getByText(QUESTIONS.associate)).toBeInTheDocument();
  });

  it("answers the children/youth question from the Children & Teens tile", async () => {
    const { user } = renderHome();
    const tile = screen.getByRole("article", { name: "Children & Teens" });
    await user.click(within(tile).getByRole("button", { name: "Get started" }));
    await user.click(screen.getByRole("button", { name: "No preference" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(QUESTIONS.childYouth)).toBeInTheDocument();
    expect(within(dialog).getByText("Yes")).toBeInTheDocument();
    expect(within(dialog).getByText(QUESTIONS.describe)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Yes" })).toBeNull();
  });
});
