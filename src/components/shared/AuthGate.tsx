"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";

export default function AuthGate({
  children,
  requireAuth = false,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(requireAuth);

  const loginTarget = useMemo(() => {
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    return `/login${next}`;
  }, [pathname]);

  useEffect(() => {
    if (!requireAuth) {
      setChecking(false);
      return;
    }

    let active = true;

    const checkSession = async () => {
      const response = await fetch("/api/auth/session", { credentials: "include" });
      const payload = (await response.json()) as { user: unknown | null };
      if (!active) return;

      if (!payload.user) {
        router.replace(loginTarget as Route);
        return;
      }

      setChecking(false);
    };

    checkSession();

    return () => {
      active = false;
    };
  }, [loginTarget, router, requireAuth]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel flex w-full max-w-md flex-col items-center gap-3 p-6 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="text-sm text-[var(--text-dimmed)]">Memverifikasi sesi login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

