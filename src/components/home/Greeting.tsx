"use client";

import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";

export default function Greeting() {
  const { displayName } = useAuth();
  const { t } = useI18n();
  return (
    <div>
      <h2 className="font-display text-[26px] font-semibold text-[var(--text-primary)]">
        {t("home.greeting", "Halo, {name}!").replace("{name}", displayName || t("profile.defaultName"))}
      </h2>
      <p className="text-sm text-[var(--text-dimmed)]">{t("home.greetingDesc", "Ringkas kondisi keuanganmu hari ini.")}</p>
    </div>
  );
}
