"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useI18n } from "@/hooks/useI18n";

export default function LockWidget({ message, messageKey }: { message?: string, messageKey?: string }) {
  const router = useRouter();
  const { t } = useI18n();

  const displayMessage = messageKey ? t(messageKey) : (message ?? t("lock.default"));

  return (
    <div className="glass-panel flex flex-col items-center gap-4 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-500/15 text-slate-300">
        <Lock size={40} />
      </div>
      <div className="space-y-1">
        <p className="font-display text-lg font-semibold text-[var(--text-primary)]">{t("lock.title")}</p>
        <p className="text-sm text-[var(--text-dimmed)]">
          {displayMessage}
        </p>
      </div>
      <Button className="px-6 py-3" onClick={() => router.push("/login")}>
        {t("lock.action")}
      </Button>
    </div>
  );
}
