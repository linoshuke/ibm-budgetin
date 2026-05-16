"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

export default function ToastHost() {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      setTimeout(() => removeToast(toast.id), 4200),
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [removeToast, toasts]);

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex w-[320px] -translate-x-1/2 flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm shadow-xl",
            toast.variant === "error" && "border-rose-500/40",
            toast.variant === "success" && "border-emerald-400/40",
            toast.variant === "info" && "border-sky-400/40",
          )}
        >
          <p className="font-semibold text-[var(--text-primary)]">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-xs text-[var(--text-dimmed)]">{toast.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
