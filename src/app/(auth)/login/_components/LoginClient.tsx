"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import LoginForm from "./LoginForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import ResetPasswordForm from "./ResetPasswordForm";

type Mode = "login" | "forgot" | "reset";

/** Sanitasi redirect path untuk mencegah open redirect attack. */
function sanitizeRedirect(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  if (/^\/\\/.test(path)) return "/";
  return path;
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => sanitizeRedirect(searchParams.get("next")), [searchParams]);
  const modeParam = useMemo(() => searchParams.get("mode"), [searchParams]);
  const [mode, setModeState] = useState<Mode>(() => {
    if (modeParam === "reset") return "reset";
    if (modeParam === "forgot") return "forgot";
    return "login";
  });

  useEffect(() => {
    if (modeParam === "reset") {
      setModeState("reset");
      return;
    }
    if (modeParam === "forgot") {
      setModeState("forgot");
      return;
    }
    setModeState("login");
  }, [modeParam]);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const response = await fetch("/api/auth/session", { credentials: "include" });
      const data = (await response.json()) as { user: { is_anonymous?: boolean } | null };
      if (!active) return;
      const isAnonymous = Boolean(data.user?.is_anonymous);
      if (data.user && !isAnonymous && modeParam !== "reset") {
        router.replace(nextPath as Route);
      }
    };

    checkSession();

    return () => {
      active = false;
    };
  }, [modeParam, nextPath, router]);

  const setMode = (nextMode: Mode) => {
    setModeState(nextMode);
    const params = new URLSearchParams();
    if (nextPath && nextPath !== "/") {
      params.set("next", nextPath);
    }
    if (nextMode !== "login") {
      params.set("mode", nextMode);
    }
    const query = params.toString();
    router.replace(query ? `/login?${query}` : "/login");
  };

  const viewMeta = useMemo(() => {
    if (mode === "forgot") {
      return {
        label: "Lupa Password",
        title: "Pulihkan akses Anda",
        description: "Masukkan email terdaftar untuk menerima tautan reset kata sandi.",
      };
    }
    if (mode === "reset") {
      return {
        label: "Reset Password",
        title: "Buat kata sandi baru",
        description: "Pastikan kata sandi baru aman dan mudah Anda ingat.",
      };
    }
    return {
      label: "Masuk",
      title: "Selamat datang kembali",
      description: "Lanjutkan pengelolaan cashflow dan pantau dompet Anda.",
    };
  }, [mode]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="flex min-h-screen items-center justify-center px-6 lg:px-8">
        <section className="w-full max-w-md">
          <main className="space-y-6">
            <h1 className="sr-only">{viewMeta.label}</h1>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-3xl bg-indigo-600/10 ring-1 ring-white/10">
                <Image
                  src="/Budgetin.png"
                  alt="Budgetin"
                  fill
                  priority
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{viewMeta.title}</h2>
              <p className="text-sm text-[var(--text-dimmed)]">{viewMeta.description}</p>
            </div>

            {mode === "login" ? (
              <LoginForm nextPath={nextPath} onForgotPassword={() => setMode("forgot")} />
            ) : null}
            {mode === "forgot" ? (
              <ForgotPasswordForm nextPath={nextPath} onBack={() => setMode("login")} />
            ) : null}
            {mode === "reset" ? (
              <ResetPasswordForm
                onSuccess={() => {
                  window.setTimeout(() => {
                    router.replace(nextPath as Route);
                  }, 1200);
                }}
              />
            ) : null}
          </main>
        </section>
      </div>
    </div>
  );
}
