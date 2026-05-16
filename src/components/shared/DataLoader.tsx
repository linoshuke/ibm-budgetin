"use client";

import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

function isAuthRoute(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/signup" ||
    pathname === "/verify-email"
  );
}

export default function DataLoader() {
  const loading = useBudgetStore((state) => state.loading);
  const pathname = usePathname();
  const authLoading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const [refreshKey, setRefreshKey] = useState(0);
  const [anonymousRequested, setAnonymousRequested] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);
  const allowAnonymous = process.env.NEXT_PUBLIC_ALLOW_ANONYMOUS !== "false";

  useEffect(() => {
    if (isAuthRoute(pathname)) return;
    const handleAuthChange = () => setRefreshKey((current) => current + 1);
    window.addEventListener("auth:changed", handleAuthChange);
    return () => {
      window.removeEventListener("auth:changed", handleAuthChange);
    };
  }, [pathname]);

  useEffect(() => {
    if (isAuthRoute(pathname)) return;
    if (authLoading) return;
    if (!allowAnonymous) return;
    if (user || anonymousRequested) return;

    let active = true;

    const createAnonymous = async () => {
      try {
        const response = await fetch("/api/auth/anonymous", { method: "POST", credentials: "include" });
        const payload = (await response.json().catch(() => ({}))) as { disabled?: boolean };
        if (!active) return;
        setAnonymousRequested(true);
        if (!payload?.disabled) {
          window.dispatchEvent(new Event("auth:changed"));
        }
      } catch {
        if (!active) return;
        setAnonymousRequested(true);
      }
    };

    void createAnonymous();

    return () => {
      active = false;
    };
  }, [anonymousRequested, authLoading, pathname, user]);

  useEffect(() => {
    if (isAuthRoute(pathname)) return;
    if (authLoading) return;

    if (!user) {
      budgetActions.setAuthState(false);
      void budgetActions.loadSystemWallets();
      return;
    }

    if (lastUserIdRef.current === user.id && refreshKey === 0) return;
    lastUserIdRef.current = user.id;

    budgetActions.setAuthState(true);
    void budgetActions.loadFromApi();
  }, [authLoading, pathname, refreshKey, user]);

  const showOverlay = !isAuthRoute(pathname) && loading;
  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-base)]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="text-sm text-[var(--text-dimmed)]">Memuat data...</p>
      </div>
    </div>
  );
}

