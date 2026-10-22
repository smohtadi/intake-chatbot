import { useCallback } from "react";
import { useLogoutMutation } from "@/store/auth/auth-api";

/**
 * Ends the server session. The logout mutation invalidates the `/me` cache, so
 * `useAuth().user` becomes null and `ProtectedRoute` renders its fallback.
 * Pass `onLoggedOut` for workflow-specific follow-up (navigate to a login
 * page, redirect to an identity provider's logout URL, ...).
 */
export default function useLogout(onLoggedOut?: () => void) {
  const [logoutMutation, { isLoading }] = useLogoutMutation();

  const logout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // A failed logout request still falls through to onLoggedOut, so the
      // user gets a predictable sign-out flow.
    }
    onLoggedOut?.();
  }, [logoutMutation, onLoggedOut]);

  return { logout, isLoading };
}
