import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import ErrorRoute from "@/app/routes/errors/error-route";

export default function ErrorBoundaryRoute() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div style={{ padding: "1rem" }}>
        <ErrorRoute />
        <p>
          {error.status} {error.statusText}
        </p>
      </div>
    );
  }

  return <ErrorRoute />;
}
