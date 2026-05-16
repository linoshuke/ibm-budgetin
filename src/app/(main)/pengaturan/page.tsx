"use client";

import { useMemo, useRef, useState } from "react";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import Modal from "@/components/shared/Modal";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import {
  getSerializableAppSettings,
  useAppSettingsStore,
  type AppLanguage,
  type CurrencyCode,
  type LocaleCode,
  type ThemeMode,
  type TextScale,
  type DefaultPeriod,
  type DefaultTransactionType,
} from "@/stores/appSettingsStore";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";

const currencyOptions: Array<{ value: CurrencyCode; label: string }> = [
  { value: "IDR", label: "IDR - Rupiah" },
  { value: "USD", label: "USD - Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
];

const localeOptions: Array<{ value: LocaleCode; label: string }> = [
  { value: "id-ID", label: "Indonesia (id-ID)" },
  { value: "en-US", label: "English (en-US)" },
];

const textScaleOptions: Array<{ value: TextScale; label: string }> = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Normal" },
  { value: "lg", label: "Large" },
];

const periodOptions: Array<{ value: DefaultPeriod; label: string }> = [
  { value: "daily", label: "Harian" },
  { value: "monthly", label: "Bulanan" },
  { value: "range", label: "Rentang" },
];

const typeOptions: Array<{ value: DefaultTransactionType; label: string }> = [
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
];

const reportOptions = [
  { value: 0, label: "Bulan ini" },
  { value: -1, label: "Bulan lalu" },
];

export default function SettingsPage() {
  const { t } = useI18n();
  const wallets = useBudgetStore((state) => state.wallets);
  const categories = useBudgetStore((state) => state.categories);

  const {
    themeMode,
    textScale,
    language,
    currency,
    numberLocale,
    dateLocale,
    defaultTransactionType,
    defaultWalletId,
    defaultCategoryId,
    defaultPeriod,
    defaultReportOffset,
    notificationsDaily,
    notificationsWeekly,
    notificationsBudgetAlerts,
    privacyHideAmounts,
    privacyAutoLock,
  } = useAppSettingsStore();

  const setSettings = useAppSettingsStore((state) => state.setSettings);
  const importSettings = useAppSettingsStore((state) => state.importSettings);

  const [savingTheme, setSavingTheme] = useState(false);
  const [confirmHideAmounts, setConfirmHideAmounts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const walletOptions = useMemo(
    () => [{ id: "", name: t("settings.noneDefault") }, ...wallets.map((wallet) => ({ id: wallet.id, name: wallet.name }))],
    [t, wallets, language],
  );

  const categoryOptions = useMemo(
    () => [{ id: "", name: t("settings.noneDefault") }, ...categories.map((category) => ({ id: category.id, name: category.name }))],
    [categories, language, t],
  );

  const handleThemeChange = async (nextTheme: ThemeMode) => {
    setSettings({ themeMode: nextTheme });
    if (nextTheme === "system") return;
    setSavingTheme(true);
    try {
      await budgetActions.setTheme(nextTheme);
    } finally {
      setSavingTheme(false);
    }
  };

  const handleExport = () => {
    const payload = {
      settings: getSerializableAppSettings(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "budgetin-settings-backup.json";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as { settings?: Record<string, unknown> };
      if (parsed.settings && typeof parsed.settings === "object") {
        importSettings(parsed.settings);
      }
    } catch (error) {
      console.warn("Gagal mengimpor data pengaturan:", error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleHideAmountsToggle = (nextValue: boolean) => {
    if (nextValue && !privacyHideAmounts) {
      setConfirmHideAmounts(true);
      return;
    }
    setSettings({ privacyHideAmounts: nextValue });
  };

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-tertiary/15 blur-3xl" />
        <div className="relative space-y-2">
          <h1 className="font-headline text-3xl font-extrabold text-on-surface">{t("settings.title")}</h1>
          <p className="max-w-2xl text-sm text-on-surface-variant">{t("settings.subtitle")}</p>
        </div>
      </header>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">{t("settings.section.language")}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t("settings.section.language_desc")}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-on-surface-variant">
            {t("settings.language")}
            <select
              value={language}
              onChange={(event) => {
                const next = event.target.value as AppLanguage;
                const nextLocale: LocaleCode = next === "en" ? "en-US" : "id-ID";
                setSettings({
                  language: next,
                  numberLocale: nextLocale,
                  dateLocale: nextLocale,
                });
              }}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
            >
              <option value="id">{t("settings.language.id")}</option>
              <option value="en">{t("settings.language.en")}</option>
            </select>
            <p className="mt-2 text-xs text-on-surface-variant/80">{t("settings.language_note")}</p>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">{t("settings.section.appearance")}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t("settings.section.appearance_desc")}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["system", "dark", "light"] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleThemeChange(mode)}
              disabled={savingTheme}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                themeMode === mode
                  ? "bg-primary text-on-primary"
                  : "border border-outline-variant/20 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {mode === "system"
                ? t("settings.theme.system")
                : mode === "dark"
                  ? t("settings.theme.dark")
                  : t("settings.theme.light")}
            </button>
          ))}
          {savingTheme ? <span className="self-center text-xs text-on-surface-variant">{t("common.saving")}</span> : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-on-surface-variant">
            {t("settings.textScale")}
            <select
              value={textScale}
              onChange={(event) => setSettings({ textScale: event.target.value as TextScale })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
            >
              {textScaleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`settings.textScale.${option.value}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">{t("settings.section.format")}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t("settings.section.format_desc")}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-on-surface-variant">
            {t("settings.currency")}
            <select
              value={currency}
              onChange={(event) => setSettings({ currency: event.target.value as CurrencyCode })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-on-surface-variant">
            {t("settings.numberLocale")}
            <select
              value={numberLocale}
              onChange={(event) => setSettings({ numberLocale: event.target.value as LocaleCode })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
            >
              {localeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-on-surface-variant">
            {t("settings.dateLocale")}
            <select
              value={dateLocale}
              onChange={(event) => setSettings({ dateLocale: event.target.value as LocaleCode })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
            >
              {localeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-3 rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-on-surface-variant">{t("settings.example.amount")}</span>
            <SensitiveCurrency value={1250000} className="font-semibold text-on-surface" eyeClassName="h-6 w-6" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-on-surface-variant">{t("settings.example.compact")}</span>
            <SensitiveCurrency value={1250000} notation="compact" maximumFractionDigits={1} className="font-semibold text-on-surface" eyeClassName="h-6 w-6" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-on-surface-variant">{t("settings.example.date")}</span>
            <span className="font-semibold text-on-surface">{formatDate(new Date().toISOString(), true)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">{t("settings.section.transactionBehavior")}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t("settings.section.transactionBehavior_desc")}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-on-surface-variant">
            {t("settings.defaultTransactionType")}
            <select
              value={defaultTransactionType}
              onChange={(event) => setSettings({ defaultTransactionType: event.target.value as DefaultTransactionType })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`settings.type.${option.value}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-on-surface-variant">
            {t("settings.defaultWallet")}
            <select
              value={defaultWalletId ?? ""}
              onChange={(event) => setSettings({ defaultWalletId: event.target.value || null })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
            >
              {walletOptions.map((option) => (
                <option key={option.id || "none"} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-on-surface-variant">
            {t("settings.defaultCategory")}
            <select
              value={defaultCategoryId ?? ""}
              onChange={(event) => setSettings({ defaultCategoryId: event.target.value || null })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
            >
              {categoryOptions.map((option) => (
                <option key={option.id || "none"} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">{t("settings.section.defaultFilters")}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t("settings.section.defaultFilters_desc")}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-on-surface-variant">
            {t("settings.defaultPeriod")}
            <select
              value={defaultPeriod}
              onChange={(event) => setSettings({ defaultPeriod: event.target.value as DefaultPeriod })}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`settings.period.${option.value}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-on-surface-variant">
            {t("settings.defaultReportMonth")}
            <select
              value={defaultReportOffset}
              onChange={(event) =>
                setSettings({ defaultReportOffset: Number(event.target.value) as 0 | -1 })
              }
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
            >
              {reportOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value === 0 ? t("settings.report.thisMonth") : t("settings.report.lastMonth")}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">{t("settings.section.notifications")}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t("settings.section.notifications_desc")}</p>

        <div className="mt-4 grid gap-3">
          <label className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm">
            {t("settings.notifications.daily")}
            <input
              type="checkbox"
              checked={notificationsDaily}
              onChange={(event) => setSettings({ notificationsDaily: event.target.checked })}
              className="h-4 w-4 accent-primary"
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm">
            {t("settings.notifications.weekly")}
            <input
              type="checkbox"
              checked={notificationsWeekly}
              onChange={(event) => setSettings({ notificationsWeekly: event.target.checked })}
              className="h-4 w-4 accent-primary"
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm">
            {t("settings.notifications.budgetAlerts")}
            <input
              type="checkbox"
              checked={notificationsBudgetAlerts}
              onChange={(event) => setSettings({ notificationsBudgetAlerts: event.target.checked })}
              className="h-4 w-4 accent-primary"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">{t("settings.section.privacy")}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t("settings.section.privacy_desc")}</p>

        <div className="mt-4 grid gap-3">
          <label className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm">
            {t("settings.privacy.hideAmounts")}
            <input
              type="checkbox"
              checked={privacyHideAmounts}
              onChange={(event) => handleHideAmountsToggle(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm">
            {t("settings.privacy.autoLock")}
            <input
              type="checkbox"
              checked={privacyAutoLock}
              onChange={(event) => setSettings({ privacyAutoLock: event.target.checked })}
              className="h-4 w-4 accent-primary"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">{t("settings.section.backup")}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t("settings.section.backup_desc")}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-outline-variant/20 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            {t("settings.export")}
          </button>
          <label className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:brightness-110">
            {t("settings.import")}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </section>

      <Modal
        open={confirmHideAmounts}
        title="Aktifkan penyamaran nominal?"
        onClose={() => setConfirmHideAmounts(false)}
        sizeClassName="max-w-lg"
      >
        <div className="space-y-4 text-sm text-on-surface-variant">
          <p className="text-on-surface">
            Fitur ini akan menyamarkan semua nominal (mis. saat Anda membuka aplikasi di tempat umum).
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Nominal akan dimask, tapi formatnya tetap terlihat.</li>
            <li>Anda bisa menekan ikon mata untuk melihat nominal sementara.</li>
          </ul>
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setConfirmHideAmounts(false)}
              className="rounded-lg border border-outline-variant/20 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              Tidak
            </button>
            <button
              type="button"
              onClick={() => {
                setSettings({ privacyHideAmounts: true });
                setConfirmHideAmounts(false);
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:brightness-110"
            >
              Iya, aktifkan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
