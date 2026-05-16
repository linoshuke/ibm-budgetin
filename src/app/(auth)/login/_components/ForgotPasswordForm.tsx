"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { FormEvent, useState } from "react";
import { getPublicOrigin } from "@/lib/public-url";

interface ForgotPasswordFormProps {
  nextPath: string;
  onBack: () => void;
}

export default function ForgotPasswordForm({ nextPath, onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleForgot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    const redirectTo = `${getPublicOrigin()}/login?mode=reset${
      nextPath && nextPath !== "/" ? `&next=${encodeURIComponent(nextPath)}` : ""
    }`;
    setLoading(false);
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, redirectTo }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? `HTTP ${response.status}`);
      }

      setNotice("Email reset password sudah dikirim. Cek inbox/spam Anda.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal mengirim email reset.");
    }
  };

  return (
    <>
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

      <form className="space-y-4" onSubmit={handleForgot}>
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Mengirim..." : "Kirim Tautan Reset"}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          Kembali ke Login
        </Button>
      </form>
    </>
  );
}
