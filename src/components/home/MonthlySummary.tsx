"use client";

import Skeleton from "@/components/ui/Skeleton";
import { useMonthlySummary } from "@/hooks/useTransactions";
import { useWalletStore } from "@/stores/walletStore";
import { useI18n } from "@/hooks/useI18n";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";

function calculateChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

function calculateExpenseImprovement(currentExpense: number, previousExpense: number) {
  if (previousExpense === 0) {
    return currentExpense === 0 ? 0 : -100;
  }
  return ((previousExpense - currentExpense) / Math.abs(previousExpense)) * 100;
}

export default function MonthlySummary() {
  const { t } = useI18n();
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);

  const now = new Date();
  const currentMonth = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = { year: prevMonthDate.getFullYear(), month: prevMonthDate.getMonth() + 1 };

  const summary = useMonthlySummary(selectedWalletIds, currentMonth);
  const prevSummary = useMonthlySummary(selectedWalletIds, prevMonth);

  if (summary.isLoading || prevSummary.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <Skeleton className="h-[120px] w-full rounded-xl" />
      </div>
    );
  }

  const income = summary.data?.total_income ?? 0;
  const expense = summary.data?.total_expense ?? 0;
  const prevIncome = prevSummary.data?.total_income ?? 0;
  const prevExpense = prevSummary.data?.total_expense ?? 0;
  const incomePercent = calculateChange(income, prevIncome);
  const expensePercent = calculateExpenseImprovement(expense, prevExpense);

  const incomeTone = incomePercent >= 0 ? "primary" : "error";
  const expenseTone = expensePercent >= 0 ? "primary" : "error";

  const incomeLabel = `${incomePercent >= 0 ? "+" : ""}${incomePercent.toFixed(1)}% ${t("home.fromLastMonth")}`;
  const expenseLabel = `${expensePercent >= 0 ? "+" : ""}${expensePercent.toFixed(1)}% ${t("home.fromLastMonth")}`;

  const incomeIcon = incomePercent >= 0 ? "arrow_upward" : "arrow_downward";
  const expenseIcon = expensePercent >= 0 ? "arrow_downward" : "arrow_upward";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container">
        <div className="flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${incomeTone === "primary" ? "bg-primary/10" : "bg-error/10"}`}>
            <span
              className={`material-symbols-outlined ${incomeTone === "primary" ? "text-primary" : "text-error"}`}
              data-icon={incomeIcon}
            >
              {incomeIcon}
            </span>
          </div>
          <span
            className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
              incomeTone === "primary" ? "bg-primary/5 text-primary" : "bg-error/5 text-error"
            }`}
          >
            {incomeLabel}
          </span>
        </div>
        <div className="mt-4">
          <div className="text-xs font-medium text-on-surface-variant">{t("home.incomeThisMonth")}</div>
          <div className="mt-1 text-2xl font-bold text-on-surface">
            <SensitiveCurrency value={income} eyeClassName="h-7 w-7 border-outline-variant/20 bg-surface-container-low/30 hover:bg-surface-container" />
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container">
        <div className="flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${expenseTone === "error" ? "bg-error/10" : "bg-primary/10"}`}>
            <span
              className={`material-symbols-outlined ${expenseTone === "error" ? "text-error" : "text-primary"}`}
              data-icon={expenseIcon}
            >
              {expenseIcon}
            </span>
          </div>
          <span
            className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
              expenseTone === "error" ? "bg-error/5 text-error" : "bg-primary/5 text-primary"
            }`}
          >
            {expenseLabel}
          </span>
        </div>
        <div className="mt-4">
          <div className="text-xs font-medium text-on-surface-variant">{t("home.expenseThisMonth")}</div>
          <div className="mt-1 text-2xl font-bold text-on-surface">
            <SensitiveCurrency value={expense} eyeClassName="h-7 w-7 border-outline-variant/20 bg-surface-container-low/30 hover:bg-surface-container" />
          </div>
        </div>
      </div>
    </div>
  );
}
