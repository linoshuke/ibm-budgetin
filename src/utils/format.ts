import { getAppSettingsState } from "@/stores/appSettingsStore";

function resolveFormatConfig() {
  const settings = getAppSettingsState();
  return {
    locale: settings.numberLocale ?? "id-ID",
    currency: settings.currency ?? "IDR",
    hideAmounts: settings.privacyHideAmounts ?? false,
  };
}

export function formatCurrency(value: number) {
  const { locale, currency, hideAmounts } = resolveFormatConfig();
  if (hideAmounts) return "****";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  const { locale, hideAmounts } = resolveFormatConfig();
  if (hideAmounts) return "***";
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatSigned(value: number, type: "income" | "expense") {
  const prefix = type === "expense" ? "-" : "+";
  return `${prefix} ${formatCurrency(Math.abs(value))}`;
}
