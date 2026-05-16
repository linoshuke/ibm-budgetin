"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { useUIStore } from "@/stores/uiStore";
import { useAppSettingsStore } from "@/stores/appSettingsStore";
import { t } from "@/lib/i18n";

export default function VerifyEmailClient() {
  const router = useRouter();
  const params = useSearchParams();
  const pushToast = useUIStore((state) => state.pushToast);
  const language = useAppSettingsStore((state) => state.language);
  const email = useMemo(() => params.get("email") ?? "", [params]);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const check = async () => {
      const response = await fetch("/api/auth/session", { credentials: "include" });
      const payload = (await response.json()) as { user: { email_confirmed_at?: string | null } | null };
      if (payload.user?.email_confirmed_at) {
        router.replace("/beranda");
      }
    };

    check();
    interval = setInterval(check, 5000);

    const handleFocus = () => check();
    window.addEventListener("focus", handleFocus);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) return;
    try {
      const response = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? `HTTP ${response.status}`);
      }
      pushToast({ title: "toast.verify_email_sent", description: "toast.check_inbox" });
      setCooldown(60);
    } catch (error) {
      pushToast({
        title: "toast.resend_failed",
        description: error instanceof Error ? error.message : "toast.resend_failed_desc",
        variant: "error",
      });
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.dispatchEvent(new Event("auth:changed"));
    router.push("/beranda");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 tablet:px-8">
      <div className="w-full max-w-[520px] rounded-3xl border border-white/10 bg-[var(--bg-card)] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--accent-indigo)]/15">
          <Mail size={80} className="text-[var(--accent-indigo)]" />
        </div>
        <h1 className="font-display text-2xl font-semibold">{t(language, "auth.verify.title")}</h1>
        <p className="mt-2 text-sm text-[var(--text-dimmed)]">
          {t(language, "auth.verify.description1")} <span className="text-[var(--accent-indigo)]">{email || t(language, "auth.verify.description2")}</span>.
        </p>
        <Button
          className="mt-6 w-full"
          onClick={handleResend}
          disabled={cooldown > 0}
        >
          {cooldown > 0 ? `${t(language, "auth.verify.resendTimer")}${cooldown}s` : t(language, "auth.verify.resend")}
        </Button>
        <Button variant="ghost" className="mt-4 w-full" onClick={handleLogout}>
          {t(language, "auth.verify.cancel")}
        </Button>
      </div>
    </div>
  );
}
