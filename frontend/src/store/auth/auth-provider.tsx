import { useEffect, useRef, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { useGetAuthUserQuery } from "./auth-api";
import { subscribeToUnauthorized } from "@/lib/auth-events";

/**
 * Exposes the current user from `GET /me`. Any 401 from the API triggers a
 * re-check of /me; if that also fails, `user` becomes null.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const meQuery = useGetAuthUserQuery();
  const { refetch, isFetching } = meQuery;

  // A 401 from /me itself must not trigger another /me request.
  const isFetchingRef = useRef(isFetching);
  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  useEffect(() => {
    return subscribeToUnauthorized(() => {
      if (isFetchingRef.current) return;
      // Set now rather than on the next render, in case /me answers first.
      isFetchingRef.current = true;
      refetch();
    });
  }, [refetch]);

  const value = {
    // RTK Query keeps the last successful `data` after a failed refetch, so
    // an error has to clear the user explicitly.
    user: meQuery.isError ? null : (meQuery.data ?? null),
    loading: meQuery.isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
