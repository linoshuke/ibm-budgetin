"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppSettingsStore } from "@/stores/appSettingsStore";

type SensitiveCurrencyProps = {
  value: number;
  notation?: "standard" | "compact";
  className?: string;
  wrapperClassName?: string;
  revealDurationMs?: number;
  eyeClassName?: string;
  showEye?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

function maskDigits(input: string) {
  return input.replace(/\d/g, "•");
}

export default function SensitiveCurrency({
  value,
  notation = "standard",
  className,
  wrapperClassName,
  revealDurationMs = 4000,
  eyeClassName,
  showEye = true,
  minimumFractionDigits,
  maximumFractionDigits = 0,
}: SensitiveCurrencyProps) {
  const privacyHideAmounts = useAppSettingsStore((state) => state.privacyHideAmounts);
  const currency = useAppSettingsStore((state) => state.currency);
  const numberLocale = useAppSettingsStore((state) => state.numberLocale);

  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let lastPrivacy = useAppSettingsStore.getState().privacyHideAmounts;
    const unsubscribe = useAppSettingsStore.subscribe((state) => {
      if (state.privacyHideAmounts === lastPrivacy) return;
      lastPrivacy = state.privacyHideAmounts;
      setRevealed(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!revealed) return undefined;
    const timer = window.setTimeout(() => setRevealed(false), revealDurationMs);
    return () => window.clearTimeout(timer);
  }, [revealDurationMs, revealed]);

  const formatted = useMemo(() => {
    const safe = Number.isFinite(value) ? value : 0;
    const valueFormatted = new Intl.NumberFormat(numberLocale ?? "id-ID", {
      style: "currency",
      currency: currency ?? "IDR",
      notation,
      compactDisplay: notation === "compact" ? "short" : undefined,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(safe);

    // Intl sering memakai NBSP (non-breaking space) antara simbol dan angka.
    // Di layar kecil ini bisa bikin nominal tidak bisa turun baris dan terlihat "terpotong".
    return valueFormatted.replace(/\u00A0/g, " ");
  }, [currency, maximumFractionDigits, minimumFractionDigits, notation, numberLocale, value]);

  const masked = useMemo(() => maskDigits(formatted), [formatted]);

  const shouldMask = privacyHideAmounts && !revealed;

  return (
    <span className={cn("inline-flex items-center gap-2", wrapperClassName)}>
      <span
        className={cn("tnum", className)}
        data-privacy-reveal={privacyHideAmounts && revealed ? "1" : "0"}
      >
        {shouldMask ? masked : formatted}
      </span>
      {privacyHideAmounts && showEye ? (
        <button
          type="button"
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setRevealed((current) => !current);
          }}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-soft)] bg-[var(--bg-card-muted)] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card)]",
            eyeClassName,
          )}
          aria-label={revealed ? "Sembunyikan nominal" : "Tampilkan nominal"}
          aria-pressed={revealed}
          title={revealed ? "Sembunyikan nominal" : "Tampilkan nominal"}
        >
          <span className="material-symbols-outlined text-base leading-none">
            {revealed ? "visibility_off" : "visibility"}
          </span>
        </button>
      ) : null}
    </span>
  );
}
