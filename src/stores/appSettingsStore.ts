"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";
export type TextScale = "sm" | "md" | "lg";
export type CurrencyCode = "IDR" | "USD" | "EUR" | "SGD";
export type LocaleCode = "id-ID" | "en-US";
export type AppLanguage = "id" | "en";
export type DefaultPeriod = "daily" | "monthly" | "range";
export type DefaultTransactionType = "income" | "expense";

export interface AppSettingsState {
  themeMode: ThemeMode;
  textScale: TextScale;
  language: AppLanguage;
  currency: CurrencyCode;
  numberLocale: LocaleCode;
  dateLocale: LocaleCode;
  defaultTransactionType: DefaultTransactionType;
  defaultWalletId: string | null;
  defaultCategoryId: string | null;
  defaultPeriod: DefaultPeriod;
  defaultReportOffset: 0 | -1;
  notificationsDaily: boolean;
  notificationsWeekly: boolean;
  notificationsBudgetAlerts: boolean;
  privacyHideAmounts: boolean;
  privacyAutoLock: boolean;
  setSettings: (payload: Partial<AppSettingsState>) => void;
  resetSettings: () => void;
  importSettings: (payload: Partial<AppSettingsState>) => void;
}

const defaultSettings: AppSettingsState = {
  themeMode: "system",
  textScale: "md",
  language: "id",
  currency: "IDR",
  numberLocale: "id-ID",
  dateLocale: "id-ID",
  defaultTransactionType: "expense",
  defaultWalletId: null,
  defaultCategoryId: null,
  defaultPeriod: "monthly",
  defaultReportOffset: 0,
  notificationsDaily: false,
  notificationsWeekly: false,
  notificationsBudgetAlerts: true,
  privacyHideAmounts: false,
  privacyAutoLock: false,
  setSettings: () => undefined,
  resetSettings: () => undefined,
  importSettings: () => undefined,
};

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setSettings: (payload) =>
        set((state) => ({
          ...state,
          ...payload,
        })),
      resetSettings: () => set(() => ({ ...defaultSettings })),
      importSettings: (payload) =>
        set((state) => ({
          ...state,
          ...payload,
        })),
    }),
    {
      name: "budgetin:app-settings",
      partialize: (state) => ({
        themeMode: state.themeMode,
        textScale: state.textScale,
        language: state.language,
        currency: state.currency,
        numberLocale: state.numberLocale,
        dateLocale: state.dateLocale,
        defaultTransactionType: state.defaultTransactionType,
        defaultWalletId: state.defaultWalletId,
        defaultCategoryId: state.defaultCategoryId,
        defaultPeriod: state.defaultPeriod,
        defaultReportOffset: state.defaultReportOffset,
        notificationsDaily: state.notificationsDaily,
        notificationsWeekly: state.notificationsWeekly,
        notificationsBudgetAlerts: state.notificationsBudgetAlerts,
        privacyHideAmounts: state.privacyHideAmounts,
        privacyAutoLock: state.privacyAutoLock,
      }),
    },
  ),
);

export function getAppSettingsState() {
  return useAppSettingsStore.getState();
}

export function getSerializableAppSettings() {
  const state = useAppSettingsStore.getState();
  return {
    themeMode: state.themeMode,
    textScale: state.textScale,
    language: state.language,
    currency: state.currency,
    numberLocale: state.numberLocale,
    dateLocale: state.dateLocale,
    defaultTransactionType: state.defaultTransactionType,
    defaultWalletId: state.defaultWalletId,
    defaultCategoryId: state.defaultCategoryId,
    defaultPeriod: state.defaultPeriod,
    defaultReportOffset: state.defaultReportOffset,
    notificationsDaily: state.notificationsDaily,
    notificationsWeekly: state.notificationsWeekly,
    notificationsBudgetAlerts: state.notificationsBudgetAlerts,
    privacyHideAmounts: state.privacyHideAmounts,
    privacyAutoLock: state.privacyAutoLock,
  } satisfies Partial<AppSettingsState>;
}
