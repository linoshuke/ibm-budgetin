"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";
import type { Route } from "next";
import { FormEvent, useEffect, useRef, useState } from "react";
import { getPublicOrigin } from "@/lib/public-url";
import { useSearchParams } from "next/navigation";
import { useAppSettingsStore, type AppLanguage } from "@/stores/appSettingsStore";
import { t } from "@/lib/i18n";

function getOAuthErrorMessage(errorCode: string | null, language: AppLanguage): string {
  if (!errorCode) return "";
  if (errorCode === "identity_already_exists") {
    return t(language, "auth.login.error.oauthExists");
  }
  if (errorCode === "oauth_exchange_failed") {
    return t(language, "auth.login.error.oauthFailed");
  }
  if (errorCode === "oauth_missing_code") {
    return t(language, "auth.login.error.oauthCancel");
  }
  return t(language, "auth.login.error.default");
}

interface LoginFormProps {
  nextPath: string;
  onForgotPassword: () => void;
}

export default function LoginForm({ nextPath, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const oauthInFlight = useRef(false);
  const searchParams = useSearchParams();

  const language = useAppSettingsStore((state) => state.language);

  // Tampilkan error dari redirect OAuth (contoh: ?error=oauth_missing_code)
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(getOAuthErrorMessage(oauthError, language));
    }
  }, [searchParams, language]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? `HTTP ${response.status}`);
      }
      window.dispatchEvent(new Event("auth:changed"));
    } catch (error) {
      setError(error instanceof Error ? error.message : t(language, "auth.login.error.failed"));
    }
  };

  const handleGoogle = async () => {
    if (oauthInFlight.current) return;
    oauthInFlight.current = true;
    setLoading(true);
    setError("");

    const { supabase } = await import("@/lib/supabase/client");
    const redirectTo = `${getPublicOrigin()}/auth/callback${
      nextPath && nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""
    }`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    setLoading(false);
    if (oauthError) {
      oauthInFlight.current = false;
      setError(oauthError.message);
    }
  };

  return (
    <>
      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-2">
          <label className="text-sm text-[var(--text-dimmed)]">{t(language, "auth.login.email")}</label>
          <Input
            type="email"
            placeholder="name@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-[var(--text-dimmed)]">{t(language, "auth.login.password")}</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dimmed)]"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? t(language, "auth.login.hide") : t(language, "auth.login.show")}
            </button>
          </div>
        </div>

        <button
          type="button"
          className="text-left text-sm text-indigo-400 hover:underline"
          onClick={onForgotPassword}
        >
          {t(language, "auth.login.forgotPassword")}
        </button>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t(language, "auth.login.processing") : t(language, "auth.login.submit")}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border-soft)]" />
        <span className="text-xs text-[var(--text-dimmed)]">{t(language, "auth.login.or")}</span>
        <div className="h-px flex-1 bg-[var(--border-soft)]" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={handleGoogle}
        disabled={loading}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/google.png" alt="" className="h-5 w-5" />
        {t(language, "auth.login.google")}
      </Button>

      <p className="text-center text-sm text-[var(--text-dimmed)]">
        {t(language, "auth.login.noAccount")}{" "}
        <Link
          href={nextPath && nextPath !== "/" ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"}
          className="font-semibold text-indigo-400 hover:underline"
        >
          {t(language, "auth.login.registerNow")}
        </Link>
      </p>

      <p className="text-center text-xs text-[var(--text-dimmed)]">
        {t(language, "auth.login.agreement")}{" "}
        <Link
          href={"/privacy" as Route}
          className="font-medium text-white underline underline-offset-4 decoration-indigo-400/70 transition hover:decoration-indigo-300/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
        >
          {t(language, "auth.login.privacy")}
        </Link>{" "}
        {t(language, "auth.login.and")}{" "}
        <Link
          href={"/terms" as Route}
          className="font-medium text-white underline underline-offset-4 decoration-indigo-400/70 transition hover:decoration-indigo-300/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
        >
          {t(language, "auth.login.terms")}
        </Link>
        .
      </p>
    </>
  );
}
