"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getPublicOrigin } from "@/lib/public-url";
import { validatePassword } from "@/lib/validators";

/** Sanitasi redirect path untuk mencegah open redirect attack. */
function sanitizeRedirect(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  if (/^\/\\/.test(path)) return "/";
  return path;
}

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => sanitizeRedirect(searchParams.get("next")), [searchParams]);

  const oauthInFlight = useRef(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const response = await fetch("/api/auth/session", { credentials: "include" });
      const data = (await response.json()) as { user: { is_anonymous?: boolean } | null };
      if (!active) return;
      const isAnonymous = Boolean(data.user?.is_anonymous);
      if (data.user && !isAnonymous) {
        router.replace(nextPath as Route);
      }
    };

    checkSession();

    return () => {
      active = false;
    };
  }, [nextPath, router]);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (!validatePassword(password)) {
      setLoading(false);
      setError("Kata sandi minimal 8 karakter dengan huruf besar, huruf kecil, dan angka.");
      return;
    }

    if (password !== confirmPassword) {
      setLoading(false);
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email,
        password,
        metadata: { name: name.trim(), full_name: name.trim() },
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setLoading(false);
      setError((payload as { error?: string }).error ?? `HTTP ${response.status}`);
      return;
    }

    const sessionResponse = await fetch("/api/auth/session", { credentials: "include" });
    const sessionPayload = (await sessionResponse.json()) as { user: { is_anonymous?: boolean } | null };
    setLoading(false);

    if (sessionPayload.user && !sessionPayload.user.is_anonymous) {
      window.dispatchEvent(new Event("auth:changed"));
      router.replace(nextPath as Route);
      return;
    }

    router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  const handleGoogle = async () => {
    if (oauthInFlight.current) return;
    oauthInFlight.current = true;
    setLoading(true);
    setError("");
    setNotice("");

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
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="flex min-h-screen items-center justify-center px-6 lg:px-8">
        <section className="w-full max-w-md">
          <header className="mb-6 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-dimmed)]">Budgetin</p>
            <h1 className="mt-2 text-base font-semibold text-[var(--text-primary)]">Daftar</h1>
          </header>

          <main className="space-y-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/15 text-indigo-500">
                <svg viewBox="0 0 24 24" width={40} height={40} aria-hidden="true">
                  <path
                    d="M12 5a4 4 0 1 1 0 8a4 4 0 0 1 0-8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M4.5 20a7.5 7.5 0 0 1 15 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18.5 6.5v4M16.5 8.5h4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Buat Akun Budgetin</h2>
              <p className="text-sm text-[var(--text-dimmed)]">
                Daftar dengan email atau Google, lalu verifikasi untuk mulai memakai aplikasi.
              </p>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {notice}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="space-y-2">
                <label className="text-sm text-[var(--text-dimmed)]">Username</label>
                <Input
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--text-dimmed)]">Email</label>
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--text-dimmed)]">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
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
                    {showPassword ? "Sembunyi" : "Lihat"}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--text-dimmed)]">Konfirmasi Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dimmed)]"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? "Sembunyi" : "Lihat"}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Memproses..." : "Daftar"}
              </Button>
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border-soft)]" />
              <span className="text-xs text-[var(--text-dimmed)]">ATAU</span>
              <div className="h-px flex-1 bg-[var(--border-soft)]" />
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/google.png" alt="" className="mr-2 inline h-5 w-5" />
              Daftar dengan Google
            </Button>

            <p className="text-center text-sm text-[var(--text-dimmed)]">
              Sudah punya akun?{" "}
              <Link
                href={nextPath && nextPath !== "/" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
                className="font-semibold text-indigo-400 hover:underline"
              >
                Masuk
              </Link>
            </p>

            <p className="text-center text-xs text-[var(--text-dimmed)]">
              Dengan mendaftar, Anda menyetujui{" "}
              <Link
                href={"/privacy" as Route}
                className="font-medium text-white underline underline-offset-4 decoration-indigo-400/70 transition hover:decoration-indigo-300/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
              >
                Kebijakan Privasi
              </Link>{" "}
              dan{" "}
              <Link
                href={"/terms" as Route}
                className="font-medium text-white underline underline-offset-4 decoration-indigo-400/70 transition hover:decoration-indigo-300/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
              >
                Ketentuan Layanan
              </Link>
              .
            </p>
          </main>
        </section>
      </div>
    </div>
  );
}
