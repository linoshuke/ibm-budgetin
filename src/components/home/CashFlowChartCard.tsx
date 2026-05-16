"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useWalletStore } from "@/stores/walletStore";
import { useAppSettingsStore } from "@/stores/appSettingsStore";
import type { MonthlySummary } from "@/types";
import { useI18n } from "@/hooks/useI18n";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";

const INCOME_COLOR = "#7cebff";
const EXPENSE_COLOR = "#adc6ff";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonths(count: number, locale: string) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat(locale || "id-ID", { month: "short" });
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return {
      key: monthKey(date),
      label: formatter.format(date),
    };
  });
}

function calculateChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(Boolean(media.matches));
    update();

    if ("addEventListener" in media) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    // Safari < 14 fallback
    if ("addListener" in media) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (media as any).addListener(update);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return () => (media as any).removeListener(update);
    }
  }, []);

  return prefersReducedMotion;
}

type CashFlowPoint = {
  key: string;
  label: string;
  income: number;
  expense: number;
};

type CashFlowTooltipContentProps = TooltipProps<number, string> & {
  incomeLabel: string;
  expenseLabel: string;
};

function CashFlowTooltip({
  active,
  payload,
  label,
  incomeLabel,
  expenseLabel,
}: CashFlowTooltipContentProps) {
  if (!active || !payload?.length) return null;

  const income = payload.find((entry) => entry.dataKey === "income")?.value ?? 0;
  const expense = payload.find((entry) => entry.dataKey === "expense")?.value ?? 0;

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high/90 px-4 py-3 shadow-xl shadow-black/20 backdrop-blur">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6 text-xs">
          <span className="inline-flex items-center gap-2 text-on-surface-variant">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: INCOME_COLOR }} />
            {incomeLabel}
          </span>
          <SensitiveCurrency value={Number(income)} showEye={false} className="text-on-surface" />
        </div>
        <div className="flex items-center justify-between gap-6 text-xs">
          <span className="inline-flex items-center gap-2 text-on-surface-variant">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: EXPENSE_COLOR }} />
            {expenseLabel}
          </span>
          <SensitiveCurrency value={Number(expense)} showEye={false} className="text-on-surface" />
        </div>
      </div>
    </div>
  );
}

export default function CashFlowChartCard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);
  const dateLocale = useAppSettingsStore((state) => state.dateLocale);
  const [range, setRange] = useState<"6m" | "1y">("6m");
  const monthCount = range === "1y" ? 12 : 6;
  const prefersReducedMotion = usePrefersReducedMotion();

  const { data: summaryRows = [] } = useQuery({
    queryKey: ["monthly-summary-series", user?.id ?? "anon", selectedWalletIds.join("-")],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) return [];
      const params = new URLSearchParams();
      if (selectedWalletIds.length) {
        params.set("walletIds", selectedWalletIds.join(","));
      }

      const response = await fetch(`/api/monthly-summary?${params.toString()}`, { 
        credentials: "include", 
      }); 
      if (!response.ok) { 
        throw new Error(`HTTP ${response.status}`); 
      } 
      return (await response.json()) as MonthlySummary[]; 
    },
  });

  const { data, maxValue, trend } = useMemo(() => {
    const months = buildMonths(monthCount, dateLocale ?? "id-ID");
    const totals = new Map<string, { income: number; expense: number }>();

    summaryRows.forEach((row) => {
      const key = `${row.year}-${String(row.month).padStart(2, "0")}`;
      const record = totals.get(key) ?? { income: 0, expense: 0 };
      record.income += Number(row.total_income ?? 0);
      record.expense += Number(row.total_expense ?? 0);
      totals.set(key, record);
    });

    const data: CashFlowPoint[] = months.map((month) => ({
      key: month.key,
      label: month.label,
      income: totals.get(month.key)?.income ?? 0,
      expense: totals.get(month.key)?.expense ?? 0,
    }));

    const maxValue = Math.max(1, ...data.map((point) => Math.max(point.income, point.expense)));

    const last = months[months.length - 1];
    const previous = months[months.length - 2];
    const currentTotals = last ? totals.get(last.key) ?? { income: 0, expense: 0 } : { income: 0, expense: 0 };
    const prevTotals = previous ? totals.get(previous.key) ?? { income: 0, expense: 0 } : { income: 0, expense: 0 };
    const incomeDelta = calculateChange(currentTotals.income, prevTotals.income);
    const expenseDelta = calculateChange(currentTotals.expense, prevTotals.expense);

    const trend = {
      income: {
        percent: incomeDelta,
        label: `${incomeDelta >= 0 ? t("home.cashFlow.trendUp") : t("home.cashFlow.trendDown")} ${Math.abs(incomeDelta).toFixed(1)}%`,
        tone: incomeDelta >= 0 ? "primary" : "error",
      },
      expense: {
        percent: expenseDelta,
        label: `${expenseDelta >= 0 ? t("home.cashFlow.trendUp") : t("home.cashFlow.trendDown")} ${Math.abs(expenseDelta).toFixed(1)}%`,
        tone: expenseDelta >= 0 ? "error" : "primary",
      },
    };

    return { data, maxValue, trend };
  }, [dateLocale, monthCount, summaryRows, t]);

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl bg-surface-container-low p-8 lg:col-span-2">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-headline text-lg font-bold">{t("home.cashFlow.title")}</h3>
          <p className="text-xs text-on-surface-variant">{t("home.cashFlow.desc")}</p>
          <div className="mt-2 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: INCOME_COLOR }} />
              {t("common.income")}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: EXPENSE_COLOR }} />
              {t("common.expense")}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
            <span
              className={`rounded-full px-2 py-1 ${
                trend.income.tone === "primary"
                  ? "bg-primary/10 text-primary"
                  : "bg-error/10 text-error"
              }`}
            >
              {t("common.income")} {trend.income.label} {t("home.fromLastMonth")}
            </span>
            <span
              className={`rounded-full px-2 py-1 ${
                trend.expense.tone === "error"
                  ? "bg-error/10 text-error"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {t("common.expense")} {trend.expense.label} {t("home.fromLastMonth")}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setRange("6m")}
            className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${
              range === "6m"
                ? "bg-surface-container-highest text-on-surface"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {t("home.cashFlow.range.6m")}
          </button>
          <button
            type="button"
            onClick={() => setRange("1y")}
            className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${
              range === "1y"
                ? "bg-surface-container-highest text-on-surface"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {t("home.cashFlow.range.1y")}
          </button>
        </div>
      </div>
      <div className="relative flex-grow">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cashflow-income-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity={0.22} />
                  <stop offset="70%" stopColor={INCOME_COLOR} stopOpacity={0.06} />
                  <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(60,73,76,0.45)" strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(187,201,204,0.92)", fontSize: 10, fontWeight: 500 }}
                minTickGap={16}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={[0, Math.max(1, maxValue) * 1.05]} />
              <Tooltip
                cursor={{ stroke: "rgba(60,73,76,0.5)", strokeWidth: 1 }}
                content={<CashFlowTooltip incomeLabel={t("common.income")} expenseLabel={t("common.expense")} />}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke={INCOME_COLOR}
                fill="url(#cashflow-income-fill)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 4, fill: INCOME_COLOR, stroke: "transparent" }}
                isAnimationActive={!prefersReducedMotion}
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke={EXPENSE_COLOR}
                fill="transparent"
                strokeWidth={2}
                strokeOpacity={0.6}
                dot={false}
                activeDot={{ r: 3, fill: EXPENSE_COLOR, stroke: "transparent" }}
                isAnimationActive={!prefersReducedMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
