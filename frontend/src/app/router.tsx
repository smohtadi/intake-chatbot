import { createBrowserRouter, Navigate } from "react-router-dom";
import { paths } from "@/config/paths";

import AppLayout from "@/components/layout/app-layout/app-layout";
import ErrorBoundaryRoute from "@/app/routes/errors/error-boundary-route";
import ProtectedRoute from "@/app/routes/protected/protected-route";
import NotFoundRoute from "@/app/routes/not-found/not-found-route";
import LoginRoute from "@/app/routes/login/login-route";
import IntakeRoute from "@/app/routes/intake/intake-route";

const router = createBrowserRouter([
  {
    path: paths.login.path,
    element: <LoginRoute />,
  },
  {
    path: paths.intake.path,
    element: (
      <ProtectedRoute fallback={<Navigate to={paths.login.getHref()} replace />}>
        <AppLayout>
          <IntakeRoute />
        </AppLayout>
      </ProtectedRoute>
    ),
    ErrorBoundary: ErrorBoundaryRoute,
  },
  { path: "*", element: <NotFoundRoute /> },
]);

export default router;
