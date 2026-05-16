"use client";

import { t as translate } from "@/lib/i18n";
import { useAppSettingsStore, type AppLanguage } from "@/stores/appSettingsStore";

export function useI18n() {
  const language = useAppSettingsStore((state) => state.language) as AppLanguage;
  const t = (key: string, fallback?: string) => translate(language ?? "id", key, fallback);
  return { language: language ?? "id", t };
}

