import { useEffect, useMemo, useState } from "react";
import { XIcon } from "lucide-react";
import Button from "@/components/ui/button/button";
import {
  subscribeToToasts,
  type ToastEvent,
} from "@/lib/toast-events";
import styles from "@/components/ui/toast/styles.module.css";

const TOAST_TTL_MS = 30_000;

function getToastTitle(status?: number): string {
  const effectiveStatus = status ?? 500;
  if (effectiveStatus >= 200 && effectiveStatus < 400) return "Success";
  return "Error";
}

interface ToastItemProps {
  toast: ToastEvent;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const title = useMemo(() => getToastTitle(toast.status), [toast.status]);

  return (
    <>
      <div className={styles.content}>
        <p className={styles.title}>
          {toast.status ? `${title} (${toast.status})` : title}
        </p>
        <p className={styles.message}>{toast.message}</p>
      </div>
      <Button
        type="button"
        appearance="ghost"
        className={styles.dismissButton}
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <XIcon size={16} />
      </Button>
    </>
  );
}

export default function ToastRegion() {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    return subscribeToToasts((event) => {
      setToasts((prev) => [...prev, event]);
    });
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, TOAST_TTL_MS),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  const visibleToasts = useMemo(() => toasts.slice(-5), [toasts]);

  if (visibleToasts.length === 0) return null;

  const total = visibleToasts.length;

  return (
    <div
      className={styles.region}
      role="status"
      aria-live="polite"
      style={{ "--toast-count": total } as React.CSSProperties}
    >
      {visibleToasts.map((toast, i) => {
        // i=0 is oldest (bottom of stack), i=total-1 is newest (top/front)
        const fromTop = total - 1 - i;
        return (
          <div
            key={toast.id}
            className={styles.toast}
            style={{
              "--toast-index": fromTop,
            } as React.CSSProperties}
          >
            <ToastItem
              toast={toast}
              onDismiss={(id) =>
                setToasts((prev) => prev.filter((item) => item.id !== id))
              }
            />
          </div>
        );
      })}
    </div>
  );
}
