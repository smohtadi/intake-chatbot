export interface ToastPayload {
  message: string;
  status?: number;
}

export interface ToastEvent extends ToastPayload {
  id: string;
}

type ToastListener = (event: ToastEvent) => void;

const listeners = new Set<ToastListener>();

export function subscribeToToasts(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitToast(payload: ToastPayload) {
  const event: ToastEvent = {
    ...payload,
    id: crypto.randomUUID(),
  };

  listeners.forEach((listener) => listener(event));
}
