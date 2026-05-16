"use client";

import { useEffect, useRef } from "react";
import { useAppSettingsStore } from "@/stores/appSettingsStore";
import { useTransactionStore } from "@/stores/transactionStore";

const TEXT_SCALE_MAP: Record<"sm" | "md" | "lg", number> = {
  sm: 0.92,
  md: 1,
  lg: 1.08,
};

export default function AppSettingsSync() {
  const themeMode = useAppSettingsStore((state) => state.themeMode);
  const textScale = useAppSettingsStore((state) => state.textScale);
  const language = useAppSettingsStore((state) => state.language);
  const privacyHideAmounts = useAppSettingsStore((state) => state.privacyHideAmounts);
  const defaultReportOffset = useAppSettingsStore((state) => state.defaultReportOffset);
  const setCurrentMonth = useTransactionStore((state) => state.setCurrentMonth);
  const lastAppliedOffset = useRef<null | number>(null);

  useEffect(() => {
    const applyTheme = (mode: "light" | "dark") => {
      document.documentElement.dataset.theme = mode;
    };

    if (themeMode === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(media.matches ? "dark" : "light");
      const handler = (event: MediaQueryListEvent) => {
        applyTheme(event.matches ? "dark" : "light");
      };
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }

    applyTheme(themeMode);
    return undefined;
  }, [themeMode]);

  useEffect(() => {
    const scale = TEXT_SCALE_MAP[textScale] ?? 1;
    document.documentElement.style.setProperty("--app-text-scale", String(scale));
  }, [textScale]);

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "id";
    document.documentElement.dataset.lang = language;
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.toggle("privacy-hide-amounts", privacyHideAmounts);
  }, [privacyHideAmounts]);

  useEffect(() => {
    if (lastAppliedOffset.current === defaultReportOffset) return;
    lastAppliedOffset.current = defaultReportOffset;
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + defaultReportOffset, 1);
    setCurrentMonth({ year: target.getFullYear(), month: target.getMonth() + 1 });
  }, [defaultReportOffset, setCurrentMonth]);

  return null;
}
