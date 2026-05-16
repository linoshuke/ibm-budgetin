"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { FormEvent, useState } from "react";
import { useAppSettingsStore } from "@/stores/appSettingsStore";
import { t } from "@/lib/i18n";

interface ResetPasswordFormProps {
  onSuccess: () => void;
}

export default function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const language = useAppSettingsStore((state) => state.language);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (newPassword.length < 8) {
      setLoading(false);
      setError(t(language, "auth.reset.error.length"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setLoading(false);
      setError(t(language, "auth.register.error.passwordMatch"));
      return;
    }

    const { supabase } = await import("@/lib/supabase/client");
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotice(t(language, "auth.reset.success"));
    onSuccess();
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

      <form className="space-y-4" onSubmit={handleReset}>
        <div className="space-y-2">
          <label className="text-sm text-[var(--text-dimmed)]">{t(language, "auth.reset.newPassword")}</label>
          <div className="relative">
            <Input
              type={showNewPassword ? "text" : "password"}
              placeholder={t(language, "auth.reset.newPasswordMin")}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dimmed)]"
              onClick={() => setShowNewPassword((prev) => !prev)}
            >
              {showNewPassword ? t(language, "auth.login.hide") : t(language, "auth.login.show")}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-[var(--text-dimmed)]">{t(language, "auth.reset.confirmPassword")}</label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t(language, "auth.reset.repeatPassword")}
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
              {showConfirmPassword ? t(language, "auth.login.hide") : t(language, "auth.login.show")}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t(language, "auth.reset.saving") : t(language, "auth.reset.submit")}
        </Button>
      </form>
    </>
  );
}
