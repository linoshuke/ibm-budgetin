"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import ToastHost from "@/components/ui/ToastHost";
import { useAuthStore } from "@/stores/authStore";
import type { User } from "@supabase/supabase-js";
import AppSettingsSync from "@/components/shared/AppSettingsSync";
import DataLoader from "@/components/shared/DataLoader";
import TransactionsQuerySync from "@/components/shared/TransactionsQuerySync";
import QuickAddTransactionModal from "@/components/transactions/QuickAddTransactionModal";

function AnimatedSwitcher({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const group = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/verify-email")
    || pathname.startsWith("/register")
    ? "auth"
    : "main";

  return (
    <div key={group} className="min-h-screen animate-fade-in">
      {children}
    </div>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const isPublicAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify-email");

  const isAnonymous = Boolean(user?.is_anonymous);
  const emailVerified = Boolean(
    user?.email_confirmed_at ?? (user as { confirmed_at?: string | null } | null)?.confirmed_at,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (loading) return;
    if (!user) return;
    if (isAnonymous) return;
    if (emailVerified) return;
    if (pathname.startsWith("/verify-email")) return;
    const email = user.email ?? "";
    router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
  }, [emailVerified, isAnonymous, loading, pathname, router, user, mounted]);

  if (isPublicAuthRoute) {
    return <>{children}</>;
  }

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent-indigo)]/30 border-t-[var(--accent-indigo)]" />
      </div>
    );
  }

  if (user && !isAnonymous && !emailVerified && !pathname.startsWith("/verify-email")) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent-indigo)]/30 border-t-[var(--accent-indigo)]" />
      </div>
    );
  }

  return <>{children}</>;
}

function SupabaseProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { credentials: "include" });
        const payload = (await response.json()) as { user: User | null };
        if (!mounted) return;
        setSession(null);
        setUser(payload.user);
        setLoading(false);
      } catch {
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    loadSession();

    const handleAuthChange = () => {
      void loadSession();
    };

    window.addEventListener("auth:changed", handleAuthChange);

    return () => {
      mounted = false;
      window.removeEventListener("auth:changed", handleAuthChange);
    };
  }, [setLoading, setSession, setUser]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
            gcTime: 5 * 60_000,
          },
        },
      }),
  );

  const content = useMemo(() => <AnimatedSwitcher>{children}</AnimatedSwitcher>, [children]);

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <DataLoader />
        <TransactionsQuerySync />
        <AuthGate>{content}</AuthGate>
      </SupabaseProvider>
      <QuickAddTransactionModal />
      <AppSettingsSync />
      <ToastHost />
    </QueryClientProvider>
  );
}
