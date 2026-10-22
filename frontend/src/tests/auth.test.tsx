import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { renderWithProviders } from "@/tests/test-utils";
import ProtectedRoute from "@/app/routes/protected/protected-route";
import useLogout from "@/hooks/use-logout";
import { useAuth } from "@/store/auth/use-auth";
import { api } from "@/lib/api-client";
import { seedUser } from "@/tests/mocks/db";

function SecretPage() {
  const { user } = useAuth();
  const { logout } = useLogout();
  return (
    <div>
      <p>Secret content for {user?.username}</p>
      <button type="button" onClick={logout}>
        Log out
      </button>
    </div>
  );
}

function renderProtected(fallback?: ReactNode) {
  return renderWithProviders(
    <ProtectedRoute fallback={fallback}>
      <SecretPage />
    </ProtectedRoute>,
  );
}

const meUnauthorized = http.get("*/api/auth/me", () =>
  HttpResponse.json({ message: "Not authenticated" }, { status: 401 }),
);

describe("auth", () => {
  it("renders protected content when /me returns a user", async () => {
    renderProtected();
    expect(
      await screen.findByText(`Secret content for ${seedUser.username}`),
    ).toBeTruthy();
  });

  it("renders the default fallback when /me returns 401", async () => {
    server.use(meUnauthorized);
    renderProtected();
    expect(await screen.findByRole("heading", { name: /not signed in/i })).toBeTruthy();
    expect(screen.queryByText(/secret content/i)).toBeNull();
  });

  it("renders a custom fallback when one is given", async () => {
    server.use(meUnauthorized);
    renderProtected(<p>Please log in</p>);
    expect(await screen.findByText("Please log in")).toBeTruthy();
  });

  it("re-checks /me and shows the fallback when any API call returns 401", async () => {
    renderProtected();
    await screen.findByText(/secret content/i);

    // The session expires server-side: every request is now unauthorized.
    server.use(
      meUnauthorized,
      http.get("*/api/session", () =>
        HttpResponse.json({ status: 401, title: "UNAUTHORIZED" }, { status: 401 }),
      ),
    );
    await api.get("/api/session").catch(() => undefined);

    expect(await screen.findByRole("heading", { name: /not signed in/i })).toBeTruthy();
    expect(screen.queryByText(/secret content/i)).toBeNull();
  });

  it("logs out and shows the fallback", async () => {
    const { user } = renderProtected();
    await screen.findByText(/secret content/i);

    await user.click(screen.getByRole("button", { name: /log out/i }));

    expect(await screen.findByRole("heading", { name: /not signed in/i })).toBeTruthy();
  });
});
