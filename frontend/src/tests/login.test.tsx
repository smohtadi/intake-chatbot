import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Navigate, Route, Routes } from "react-router-dom";
import { server } from "@/tests/mocks/server";
import { db, DEMO_PASSWORD } from "@/tests/mocks/db";
import { renderWithProviders } from "@/tests/test-utils";
import LoginRoute from "@/app/routes/login/login-route";
import ProtectedRoute from "@/app/routes/protected/protected-route";

function renderApp(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/"
        element={
          <ProtectedRoute fallback={<Navigate to="/login" replace />}>
            <p>Intake page</p>
          </ProtectedRoute>
        }
      />
    </Routes>,
    { route },
  );
}

describe("login", () => {
  it("redirects to /login when signed out", async () => {
    db.user = null;
    renderApp("/");
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(screen.getByRole("note")).toHaveTextContent("Demo only");
  });

  it("shows an inline error for wrong credentials", async () => {
    db.user = null;
    const { user } = renderApp("/login");
    await user.type(await screen.findByLabelText("Username"), "demo");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password.");
  });

  it("validates required fields", async () => {
    db.user = null;
    const { user } = renderApp("/login");
    await user.click(await screen.findByRole("button", { name: "Sign in" }));
    expect(await screen.findAllByText("This field is required")).toHaveLength(2);
  });

  it("opens the intake after a successful sign in", async () => {
    db.user = null;
    const { user } = renderApp("/login");
    await user.type(await screen.findByLabelText("Username"), "demo");
    await user.type(screen.getByLabelText("Password"), DEMO_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Intake page")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });

  it("toasts nothing and shows no inline error for rate limiting", async () => {
    db.user = null;
    server.use(
      http.post("*/api/auth/login", () => HttpResponse.json({ status: 429, title: "RATE_LIMITED" }, { status: 429 })),
    );
    const { user } = renderApp("/login");
    await user.type(await screen.findByLabelText("Username"), "demo");
    await user.type(screen.getByLabelText("Password"), "x");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("button", { name: "Sign in" });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
