import type { ReactNode } from "react";
import Loader from "@/components/ui/loader/loader";
import { useAuth } from "@/store/auth/use-auth";
import NotSignedIn from "@/app/routes/protected/not-signed-in";

interface IProps {
  children: ReactNode;
  /**
   * Rendered when there is no authenticated user. This is where each project
   * plugs in its auth workflow, e.g.
   *   <Navigate to="/login" replace />            (local login page)
   *   <ExternalRedirect to={IDP_LOGIN_URL} />     (identity provider)
   */
  fallback?: ReactNode;
}

export default function ProtectedRoute({ children, fallback }: IProps) {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <>{fallback ?? <NotSignedIn />}</>;
  return <>{children}</>;
}
