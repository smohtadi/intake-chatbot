import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/tests/test-utils";
import AppHeader from "@/components/layout/app-header/app-header";

describe("app header nav", () => {
  it("links to the home page and our team", async () => {
    const { user } = renderWithProviders(<AppHeader />, { route: "/team/spec-1/edit" });
    const nav = await screen.findByRole("navigation", { name: "Main" });
    const team = screen.getByRole("link", { name: "Our Team" });
    expect(nav).toContainElement(team);
    expect(team).toHaveAttribute("aria-current", "page");

    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });

  it("opens the chat from Book a call", async () => {
    const { store, user } = renderWithProviders(<AppHeader />);
    await user.click(await screen.findByRole("button", { name: "Book a call" }));
    expect(store.getState().chat.isOpen).toBe(true);
  });
});
