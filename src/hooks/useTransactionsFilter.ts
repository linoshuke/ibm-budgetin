import { useState } from "react";
import { getMonthLabel, monthKey } from "@/lib/utils";
import { useAppSettingsStore } from "@/stores/appSettingsStore";

export type PeriodMode = "daily" | "monthly" | "range";

/**
 * Hook ini hanya mengelola STATE filter (period, selectedMonth, dateRange).
 * Filtering data dilakukan secara terpisah di komponen pemanggil menggunakan useMemo
 * agar tidak terjadi circular dependency: transactions → filter → fetchPage → transactions.
 */
export function useTransactionsFilter(initialPeriod?: PeriodMode) {
  const defaultPeriod = useAppSettingsStore((state) => state.defaultPeriod);
  const [period, setPeriod] = useState<PeriodMode>(initialPeriod ?? defaultPeriod ?? "daily");
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    () => new Date(),
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const monthLabel = getMonthLabel(monthKey(selectedMonth));
  const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
  const now = new Date();
  const canGoNext =
    nextMonth.getFullYear() < now.getFullYear() ||
    (nextMonth.getFullYear() === now.getFullYear() && nextMonth.getMonth() <= now.getMonth());

  const goPrevMonth = () =>
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));

  const goNextMonth = () => {
    if (!canGoNext) return;
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  return {
    period,
    setPeriod,
    selectedMonth,
    setSelectedMonth,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    monthLabel,
    canGoNext,
    goPrevMonth,
    goNextMonth,
  };
}
