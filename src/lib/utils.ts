import { getAppSettingsState } from "@/stores/appSettingsStore";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getCurrencyFormatter(locale: string, currency: string) {
  const key = `${locale}|${currency}`;
  const cached = currencyFormatterCache.get(key);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  currencyFormatterCache.set(key, formatter);
  return formatter;
}

function getDateFormatter(dateLocale: string, withYear: boolean) {
  const key = `${dateLocale}|date|${withYear ? "1" : "0"}`;
  const cached = dateFormatterCache.get(key);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "short",
    year: withYear ? "numeric" : undefined,
  });
  dateFormatterCache.set(key, formatter);
  return formatter;
}

function getMonthLabelFormatter(dateLocale: string) {
  const key = `${dateLocale}|monthLabel`;
  const cached = dateFormatterCache.get(key);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat(dateLocale, {
    month: "long",
    year: "numeric",
  });
  dateFormatterCache.set(key, formatter);
  return formatter;
}

function resolveFormatConfig() {
  const settings = getAppSettingsState();
  return {
    locale: settings.numberLocale ?? "id-ID",
    currency: settings.currency ?? "IDR",
    dateLocale: settings.dateLocale ?? "id-ID",
    hideAmounts: settings.privacyHideAmounts ?? false,
  };
}

export function formatCurrency(value: number) {
  const { locale, currency, hideAmounts } = resolveFormatConfig();
  if (hideAmounts) return "****";
  return getCurrencyFormatter(locale, currency).format(value);
}

export function formatDate(date: string, withYear = false) {
  const { dateLocale } = resolveFormatConfig();
  return getDateFormatter(dateLocale, withYear).format(new Date(date));
}

export function monthKey(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getIsoDateToday() {
  return new Date().toISOString().slice(0, 10);
}

export function getMonthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  const { dateLocale } = resolveFormatConfig();
  return getMonthLabelFormatter(dateLocale).format(new Date(year, month - 1, 1));
}

export function toCsvRow(values: Array<string | number>) {
  return values
    .map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`)
    .join(",");
}
