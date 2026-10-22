import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { makeStore } from "@/store/store";
import { AuthProvider } from "@/store/auth/auth-provider";

interface IRenderOptions {
  // Initial URL, e.g. "/app/posts/1".
  route?: string;
  // Route pattern to mount `ui` under, e.g. "/app/posts/:id", so useParams
  // works. Without it `ui` renders regardless of the URL.
  path?: string;
}

// Renders the current location so tests can assert on navigation.
function LocationDisplay() {
  const location = useLocation();
  return (
    <div data-testid="location">{location.pathname + location.search}</div>
  );
}

/**
 * Renders `ui` with a fresh store (no cache shared between tests), the auth
 * provider and an in-memory router.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = "/", path }: IRenderOptions = {},
) {
  const store = makeStore();
  const user = userEvent.setup();
  const result = render(
    <Provider store={store}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>
          {path ? (
            <Routes>
              <Route path={path} element={ui} />
              <Route path="*" element={null} />
            </Routes>
          ) : (
            ui
          )}
          <LocationDisplay />
        </MemoryRouter>
      </AuthProvider>
    </Provider>,
  );
  return { store, user, ...result };
}
