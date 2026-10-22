// Decouples the HTTP client from auth state: api-client emits when any request
// comes back 401, and AuthProvider decides what that means (re-check /me).

type UnauthorizedListener = () => void;

const listeners = new Set<UnauthorizedListener>();

export function subscribeToUnauthorized(listener: UnauthorizedListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitUnauthorized() {
  listeners.forEach((listener) => listener());
}
