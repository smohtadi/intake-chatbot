import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { paths } from "@/config/paths";

import AppLayout from "@/components/layout/app-layout/app-layout";
import ErrorBoundaryRoute from "@/app/routes/errors/error-boundary-route";
import ProtectedRoute from "@/app/routes/protected/protected-route";
import NotFoundRoute from "@/app/routes/not-found/not-found-route";
import LoginRoute from "@/app/routes/login/login-route";
import ChatWidget from "@/app/chat-widget/chat-widget";
import HomeRoute from "@/app/routes/home/home-route";
import TeamRoute from "@/app/routes/specialists/team-route";
import SpecialistEditRoute from "@/app/routes/specialists/specialist-edit-route";

const router = createBrowserRouter([
  {
    path: paths.login.path,
    element: <LoginRoute />,
  },
  {
    element: (
      <ProtectedRoute fallback={<Navigate to={paths.login.getHref()} replace />}>
        <AppLayout>
          <Outlet />
          <ChatWidget />
        </AppLayout>
      </ProtectedRoute>
    ),
    ErrorBoundary: ErrorBoundaryRoute,
    children: [
      { path: paths.home.path, element: <HomeRoute /> },
      { path: paths.team.path, element: <TeamRoute /> },
      { path: paths.specialistEdit.path, element: <SpecialistEditRoute /> },
    ],
  },
  { path: "*", element: <NotFoundRoute /> },
]);

export default router;
