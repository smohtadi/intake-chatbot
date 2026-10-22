import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ToastRegion from "@/components/ui/toast/toast-region";
import NotFound from "@/app/routes/not-found/not-found-route";
import ErrorRoute from "@/app/routes/errors/error-route";
import { emitToast } from "@/lib/toast-events";

describe("UI foundations", () => {
  it("renders not-found route fallback", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText(/page not found/i)).toBeTruthy();
    expect(screen.getByText(/return to the intake/i)).toBeTruthy();
  });

  it("renders error route fallback", () => {
    render(<ErrorRoute />);
    expect(screen.getByText(/something went wrong/i)).toBeTruthy();
  });

  it("renders stacked toasts and supports manual dismissal", async () => {
    const user = userEvent.setup();

    render(<ToastRegion />);

    emitToast({ message: "Network timeout", status: 504 });
    emitToast({ message: "Server error", status: 500 });

    expect(await screen.findByText(/network timeout/i)).toBeTruthy();
    expect(await screen.findByText(/server error/i)).toBeTruthy();

    const dismissButtons = screen.getAllByRole("button", {
      name: /dismiss notification/i,
    });

    await user.click(dismissButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText(/network timeout/i)).toBeNull();
    });
  });
});
