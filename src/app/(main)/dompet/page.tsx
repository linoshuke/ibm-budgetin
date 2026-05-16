"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useNonceStyle } from "@/hooks/useNonceStyle";
import { useBudgetStore } from "@/store/budgetStore";
import { useTransactionStore } from "@/stores/transactionStore";
import LockWidget from "@/components/LockWidget";
import Modal from "@/components/shared/Modal";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import { monthKey } from "@/lib/utils";
import { getMonthLabel } from "@/utils/date";
import type { CategoryBudget, Goal, Transaction } from "@/types";
import type { Category } from "@/types/category";
import type { Wallet } from "@/types/wallet";

const BASELINE_MONTHS = 3;
const MIN_BUDGET = 100_000;
const CIRCLE_RADIUS = 58;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const statusStyles = {
  healthy: {
    bar: "bg-primary",
    label: "Healthy Status",
    text: "text-primary",
  },
  caution: {
    bar: "bg-yellow-400",
    label: "Caution: Approaching Limit",
    text: "text-yellow-400",
  },
  critical: {
    bar: "bg-error",
    label: "Critical: Budget Exhausted",
    text: "text-error",
  },
} as const;

const GOAL_ACCENTS = ["primary", "tertiary", "secondary"] as const;

function ProgressBar({ percent, className }: { percent: number; className: string }) {
  const clamped = Math.min(Math.max(percent * 100, 0), 100);
  const widthClass = useNonceStyle(`width: ${clamped}%;`);
  return <div className={`absolute left-0 top-0 h-full rounded-full ${className} ${widthClass}`} />;
}

type BudgetStatus = keyof typeof statusStyles;

type BudgetRow = {
  id: string;
  name: string;
  icon: string;
  spent: number;
  budget: number;
  percent: number;
  status: BudgetStatus;
};

type GoalRow = {
  id: string;
  name: string;
  accent: "primary" | "tertiary" | "secondary";
  saved: number;
  target: number;
  percent: number;
  targetDate: string;
  targetDateISO?: string;
  isSuggested?: boolean;
  source?: Goal;
};

type BudgetTransaction = Pick<Transaction, "id" | "amount" | "type" | "date" | "category_id">;

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function roundBudget(value: number) {
  if (!Number.isFinite(value)) return MIN_BUDGET;
  const rounded = Math.ceil(value / 10_000) * 10_000;
  return Math.max(rounded, MIN_BUDGET);
}

function buildPreviousMonthKeys(year: number, month: number, count: number) {
  const keys: string[] = [];
  for (let index = 1; index <= count; index += 1) {
    const date = new Date(year, month - 1 - index, 1);
    keys.push(monthKey(date));
  }
  return keys;
}

function buildRangeForBaseline(year: number, month: number, count: number) {
  const startDate = new Date(year, month - 1 - count, 1);
  const endDate = new Date(year, month, 0);
  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
  };
}

function resolveCategoryIcon(category: Category) {
  const code = category.icon?.toUpperCase();
  const name = category.name.toLowerCase();

  const codeMap: Record<string, string> = {
    FOOD: "shopping_cart",
    MOVE: "directions_car",
    BILL: "home",
    PAY: "payments",
    PLUS: "savings",
    FUN: "movie",
    HEALTH: "favorite",
  };

  if (code && codeMap[code]) return codeMap[code];
  if (name.includes("makan") || name.includes("food") || name.includes("grocery")) return "shopping_cart";
  if (name.includes("transport") || name.includes("bensin") || name.includes("travel")) return "directions_car";
  if (name.includes("tagih") || name.includes("bill") || name.includes("util") || name.includes("sewa")) return "home";
  if (name.includes("hibur") || name.includes("entertain") || name.includes("movie")) return "movie";
  if (name.includes("kesehatan") || name.includes("health") || name.includes("med")) return "favorite";
  if (name.includes("gaji") || name.includes("income")) return "payments";
  return "category";
}

function resolveDefaultBudget(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("makan") || normalized.includes("food") || normalized.includes("grocery")) return 1_750_000;
  if (normalized.includes("transport") || normalized.includes("bensin") || normalized.includes("travel")) return 900_000;
  if (normalized.includes("tagih") || normalized.includes("bill") || normalized.includes("util") || normalized.includes("sewa")) return 2_500_000;
  if (normalized.includes("hibur") || normalized.includes("entertain") || normalized.includes("movie")) return 700_000;
  if (normalized.includes("kesehatan") || normalized.includes("health") || normalized.includes("med")) return 850_000;
  return 600_000;
}

function computeMonthlyTotals(transactions: BudgetTransaction[]) {
  const totals = new Map<string, { income: number; expense: number }>();
  transactions.forEach((item) => {
    const key = monthKey(item.date);
    const record = totals.get(key) ?? { income: 0, expense: 0 };
    const amount = toNumber(item.amount);
    if (item.type === "income") record.income += amount;
    if (item.type === "expense") record.expense += amount;
    totals.set(key, record);
  });
  return totals;
}

function computeRecommendedBudgets(
  categories: Category[],
  transactions: BudgetTransaction[],
  currentKey: string,
  baselineKeys: string[],
) {
  const baselineSet = new Set(baselineKeys);
  const baselineTotals = new Map<string, Record<string, number>>();

  transactions.forEach((item) => {
    if (item.type !== "expense") return;
    if (!item.category_id) return;

    const key = monthKey(item.date);
    if (key === currentKey) return;
    if (!baselineSet.has(key)) return;

    const record = baselineTotals.get(item.category_id) ?? {};
    record[key] = (record[key] ?? 0) + toNumber(item.amount);
    baselineTotals.set(item.category_id, record);
  });

  const expenseCategories = categories.filter((category) => category.type !== "income");

  return new Map(
    expenseCategories.map((category) => {
      const baselineRecord = baselineTotals.get(category.id) ?? {};
      const baselineSum = baselineKeys.reduce((sum, key) => sum + (baselineRecord[key] ?? 0), 0);
      const baselineAvg = baselineKeys.length > 0 ? baselineSum / baselineKeys.length : 0;
      const defaultBudget = resolveDefaultBudget(category.name);
      const recommended = roundBudget(Math.max(defaultBudget, baselineAvg * 1.15));
      return [category.id, recommended];
    }),
  );
}

function computeCurrentSpend(transactions: BudgetTransaction[], currentKey: string) {
  const totals = new Map<string, number>();
  transactions.forEach((item) => {
    if (item.type !== "expense") return;
    if (!item.category_id) return;
    if (monthKey(item.date) !== currentKey) return;
    totals.set(item.category_id, (totals.get(item.category_id) ?? 0) + toNumber(item.amount));
  });
  return totals;
}

function buildBudgetRows(
  categories: Category[],
  transactions: BudgetTransaction[],
  currentKey: string,
  baselineKeys: string[],
  budgetOverrides: Map<string, number>,
) {
  const baselineSet = new Set(baselineKeys);
  const currentTotals = new Map<string, number>();
  const baselineTotals = new Map<string, Record<string, number>>();

  transactions.forEach((item) => {
    if (item.type !== "expense") return;
    if (!item.category_id) return;

    const key = monthKey(item.date);
    const amount = toNumber(item.amount);

    if (key === currentKey) {
      currentTotals.set(item.category_id, (currentTotals.get(item.category_id) ?? 0) + amount);
      return;
    }

    if (baselineSet.has(key)) {
      const record = baselineTotals.get(item.category_id) ?? {};
      record[key] = (record[key] ?? 0) + amount;
      baselineTotals.set(item.category_id, record);
    }
  });

  const expenseCategories = categories.filter((category) => category.type !== "income");

  const rows: BudgetRow[] = expenseCategories.map((category) => {
    const spent = currentTotals.get(category.id) ?? 0;
    const baselineRecord = baselineTotals.get(category.id) ?? {};
    const baselineSum = baselineKeys.reduce((sum, key) => sum + (baselineRecord[key] ?? 0), 0);
    const baselineAvg = baselineKeys.length > 0 ? baselineSum / baselineKeys.length : 0;
    const defaultBudget = resolveDefaultBudget(category.name);
    const override = budgetOverrides.get(category.id);
    const budget = override !== undefined ? Math.max(override, 0) : roundBudget(Math.max(defaultBudget, baselineAvg * 1.15));
    const percent = budget ? spent / budget : 0;
    const status: BudgetStatus = percent >= 0.9 ? "critical" : percent >= 0.75 ? "caution" : "healthy";

    return {
      id: category.id,
      name: category.name,
      icon: resolveCategoryIcon(category),
      spent,
      budget,
      percent,
      status,
    };
  });

  const totalRemaining = rows.reduce((sum, row) => sum + Math.max(row.budget - row.spent, 0), 0);
  const sortedRows = [...rows].sort((a, b) => b.percent - a.percent);
  const visibleRows = sortedRows.slice(0, Math.max(4, Math.min(6, sortedRows.length)));

  return { rows: visibleRows, totalRemaining };
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildGoals(wallets: Wallet[], avgExpense: number, avgSavings: number) {
  const normalizedWallets = wallets.map((wallet) => ({
    ...wallet,
    balance: toNumber(wallet.balance),
  }));

  const savingsWallets = normalizedWallets.filter((wallet) => {
    const name = wallet.name.toLowerCase();
    const category = wallet.category?.toLowerCase() ?? "";
    return name.includes("tabung") || name.includes("saving") || category.includes("invest") || category.includes("saving");
  });

  const fallbackWallets = savingsWallets.length ? savingsWallets : normalizedWallets;
  const savingsBalance = fallbackWallets.reduce((sum, wallet) => sum + (wallet.balance ?? 0), 0);
  const baseExpense = avgExpense > 0 ? avgExpense : savingsBalance > 0 ? savingsBalance / 3 : 0;

  if (baseExpense <= 0) {
    return [];
  }

  const configs = [
    {
      id: "goal-emergency",
      name: "Dana Darurat",
      accent: "primary" as const,
      multiplier: 3,
      minTarget: 6_000_000,
      ratio: 0.65,
      fallbackRatio: 0.45,
      fallbackMonths: 6,
    },
    {
      id: "goal-trip",
      name: "Liburan Impian",
      accent: "tertiary" as const,
      multiplier: 2,
      minTarget: 10_000_000,
      ratio: 0.35,
      fallbackRatio: 0.3,
      fallbackMonths: 8,
    },
  ];

  return configs.map((config) => {
    const target = Math.max(baseExpense * config.multiplier, config.minTarget);
    const saved = savingsBalance > 0
      ? Math.min(savingsBalance * config.ratio, target * 0.95)
      : Math.min(target * config.fallbackRatio, target * 0.95);
    const percent = target ? saved / target : 0;
    const remaining = Math.max(target - saved, 0);
    const months = avgSavings > 0
      ? Math.max(1, Math.ceil(remaining / avgSavings))
      : config.fallbackMonths;
    const targetDate = addMonths(new Date(), months);

    return {
      id: config.id,
      name: config.name,
      accent: config.accent,
      saved,
      target,
      percent,
      targetDate: formatShortDate(targetDate),
      targetDateISO: targetDate.toISOString().slice(0, 10),
    };
  });
}

function buildSuggestion(
  rows: BudgetRow[],
  goals: GoalRow[],
  avgSavings: number,
): { headline: ReactNode; detail: string } {
  if (!rows.length || !goals.length) {
    return {
      headline: "Belum ada data anggaran untuk dianalisis.",
      detail: "Tambahkan transaksi agar sistem bisa menghitung rekomendasi otomatis.",
    };
  }

  const underused = rows
    .filter((row) => row.percent < 0.6 && row.budget > row.spent)
    .slice(0, 2);

  if (!underused.length) {
    return {
      headline: "Pengeluaran bulan ini cukup padat.",
      detail: "Coba alokasikan ulang pos yang sudah mendekati batas untuk menjaga stabilitas kas.",
    };
  }

  const potential = underused.reduce((sum, row) => sum + Math.max(row.budget - row.spent, 0), 0) * 0.35;
  const targetGoal = goals[0];
  const estimatedDays = avgSavings > 0 ? Math.max(3, Math.round(potential / (avgSavings / 30))) : 14;
  const names = underused.map((row) => row.name).join(" dan ");

  return {
    headline: (
      <>
        Anda berpeluang mengalihkan{" "}
        <SensitiveCurrency value={potential} eyeClassName="h-6 w-6" wrapperClassName="gap-1" /> bulan ini.
      </>
    ),
    detail: `Dengan mengoptimalkan pos ${names}, target ${targetGoal.name} bisa maju sekitar ${estimatedDays} hari.`,
  };
}

export default function BudgetsPage() {
  const { user, isAnonymous, loading: authLoading } = useAuth();
  const { currentMonth } = useTransactionStore();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [targetInput, setTargetInput] = useState("");
  const [targetError, setTargetError] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);
  const [quickSavingId, setQuickSavingId] = useState<string | null>(null);
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [draftTargets, setDraftTargets] = useState<Record<string, string>>({});
  const [bulkError, setBulkError] = useState("");
  const [savingBulk, setSavingBulk] = useState(false);
  const [resettingAll, setResettingAll] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalName, setGoalName] = useState("");
  const [goalTargetInput, setGoalTargetInput] = useState("");
  const [goalSavedInput, setGoalSavedInput] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalError, setGoalError] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  const currentKey = useMemo(
    () => monthKey(new Date(currentMonth.year, currentMonth.month - 1, 1)),
    [currentMonth.month, currentMonth.year],
  );

  const baselineKeys = useMemo(
    () => buildPreviousMonthKeys(currentMonth.year, currentMonth.month, BASELINE_MONTHS),
    [currentMonth.month, currentMonth.year],
  );

  const { start, end } = useMemo(
    () => buildRangeForBaseline(currentMonth.year, currentMonth.month, BASELINE_MONTHS),
    [currentMonth.month, currentMonth.year],
  );

  const { data: budgetsData = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ["category-budgets", user?.id ?? "anon", currentKey],
    enabled: Boolean(user) && !isAnonymous,
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/category-budgets?monthKey=${encodeURIComponent(currentKey)}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return (await response.json()) as CategoryBudget[];
    },
  });

  const { data: goalsData = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["goals", user?.id ?? "anon"],
    enabled: Boolean(user) && !isAnonymous,
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch("/api/goals", { credentials: "include" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return (await response.json()) as Goal[];
    },
  });

  const categories = useBudgetStore((state) => state.categories) as Category[];
  const wallets = useBudgetStore((state) => state.wallets) as Wallet[];
  const budgetLoading = useBudgetStore((state) => state.loading);

  const { data: transactionsData = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions", "budget", user?.id ?? "anon", start, end],
    enabled: Boolean(user) && !isAnonymous,
    queryFn: async () => {
      if (!user) return [];
      const pageLimit = 500;
      let offset = 0;
      let hasMore = true;
      const items: BudgetTransaction[] = [];

      while (hasMore) {
        const params = new URLSearchParams({
          limit: String(pageLimit),
          offset: String(offset),
          dateFrom: start,
          dateTo: end,
        });

        const response = await fetch(`/api/transactions?${params.toString()}`, { 
          credentials: "include", 
        }); 
        if (!response.ok) { 
          throw new Error(`HTTP ${response.status}`); 
        } 
        const payload = (await response.json()) as { 
          items: Array<{
            id: string;
            amount: number;
            type: Transaction["type"];
            date: string;
            categoryId?: string | null;
          }>;
          hasMore: boolean;
          nextOffset: number | null;
        };

        const mapped = (payload.items ?? []).map((item) => ({
          id: item.id,
          amount: Number(item.amount ?? 0),
          type: item.type,
          date: item.date,
          category_id: item.categoryId ?? null,
        })) as BudgetTransaction[];

        items.push(...mapped);
        hasMore = Boolean(payload.hasMore);
        if (!payload.nextOffset) break;
        offset = payload.nextOffset;

        if (offset > 2500) break;
      }

      return items;
    },
  });

  const transactions = transactionsData;
  const budgetMap = useMemo(
    () => new Map(budgetsData.map((item) => [item.category_id, toNumber(item.target_amount)])),
    [budgetsData],
  );
  const budgetRecordMap = useMemo(
    () => new Map(budgetsData.map((item) => [item.category_id, item])),
    [budgetsData],
  );
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type !== "income"),
    [categories],
  );
  const recommendedMap = useMemo(
    () => computeRecommendedBudgets(categories, transactions, currentKey, baselineKeys),
    [baselineKeys, categories, currentKey, transactions],
  );
  const currentSpendMap = useMemo(
    () => computeCurrentSpend(transactions, currentKey),
    [currentKey, transactions],
  );

  const monthlyTotals = useMemo(() => computeMonthlyTotals(transactions), [transactions]);

  const averages = useMemo(() => {
    const baselineTotals = baselineKeys.map((key) => monthlyTotals.get(key) ?? { income: 0, expense: 0 });
    const totalIncome = baselineTotals.reduce((sum, item) => sum + item.income, 0);
    const totalExpense = baselineTotals.reduce((sum, item) => sum + item.expense, 0);
    const count = Math.max(1, baselineKeys.length);
    const avgIncome = totalIncome / count;
    const avgExpense = totalExpense / count;
    const avgSavings = avgIncome - avgExpense;

    const currentTotals = monthlyTotals.get(currentKey) ?? { income: 0, expense: 0 };
    if (avgIncome === 0 && avgExpense === 0) {
      return {
        avgIncome: currentTotals.income,
        avgExpense: currentTotals.expense,
        avgSavings: currentTotals.income - currentTotals.expense,
      };
    }

    return { avgIncome, avgExpense, avgSavings };
  }, [baselineKeys, currentKey, monthlyTotals]);

  const { rows: budgetRows, totalRemaining } = useMemo(
    () => buildBudgetRows(categories, transactions, currentKey, baselineKeys, budgetMap),
    [baselineKeys, budgetMap, categories, currentKey, transactions],
  );

  const hasGoalBaseline = wallets.length > 0 && transactions.length > 0;
  const suggestedGoals = useMemo<GoalRow[]>(
    () => (hasGoalBaseline ? buildGoals(wallets, averages.avgExpense, averages.avgSavings) : []),
    [averages.avgExpense, averages.avgSavings, hasGoalBaseline, wallets],
  );

  const storedGoals = useMemo<GoalRow[]>(() => {
    return goalsData.map((goal, index) => {
      const target = Math.max(0, toNumber(goal.target_amount));
      const saved = Math.max(0, toNumber(goal.current_amount));
      const percent = target ? saved / target : 0;
      const targetDate = goal.target_date ? formatShortDate(new Date(goal.target_date)) : "Tanpa tanggal";

      return {
        id: goal.id,
        name: goal.name,
        accent: GOAL_ACCENTS[index % GOAL_ACCENTS.length],
        saved,
        target,
        percent,
        targetDate,
        targetDateISO: goal.target_date ?? undefined,
        source: goal,
      } satisfies GoalRow;
    });
  }, [goalsData]);

  const activeGoals = useMemo<GoalRow[]>(() => {
    if (storedGoals.length) return storedGoals;
    return suggestedGoals.map((goal) => ({ ...goal, isSuggested: true }));
  }, [storedGoals, suggestedGoals]);

  const suggestion = useMemo(
    () => buildSuggestion(budgetRows, activeGoals, averages.avgSavings),
    [activeGoals, averages.avgSavings, budgetRows],
  );

  const monthLabel = useMemo(
    () => getMonthLabel(currentMonth.year, currentMonth.month),
    [currentMonth.month, currentMonth.year],
  );

  const loading = budgetLoading || transactionsLoading || budgetsLoading;

  const handleStartEdit = (categoryId: string) => {
    const currentTarget = budgetMap.get(categoryId);
    setEditingId(categoryId);
    setTargetInput(currentTarget ? String(Math.round(currentTarget)) : "");
    setTargetError("");
  };

  const handleSaveTarget = async (categoryId: string) => {
    if (!user) return;
    const raw = targetInput.replace(/\D/g, "");
    const amount = Number(raw);
    if (!raw || !Number.isFinite(amount) || amount <= 0) {
      setTargetError("Masukkan nominal target yang valid.");
      return;
    }

    try {
      setSavingTarget(true);
      setTargetError("");
      const response = await fetch("/api/category-budgets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          monthKey: currentKey,
          targetAmount: amount,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? `HTTP ${response.status}`);
      }
      await queryClient.invalidateQueries({ queryKey: ["category-budgets", user.id, currentKey] });
      setEditingId(null);
      setTargetInput("");
    } catch (error) {
      setTargetError(error instanceof Error ? error.message : "Gagal menyimpan target.");
    } finally {
      setSavingTarget(false);
    }
  };

  const handleDeleteTarget = async (categoryId: string) => {
    if (!user) return;
    const record = budgetRecordMap.get(categoryId);
    if (!record) return;

    try {
      setSavingTarget(true);
      setTargetError("");
      const response = await fetch("/api/category-budgets", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [record.id] }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? `HTTP ${response.status}`);
      }
      await queryClient.invalidateQueries({ queryKey: ["category-budgets", user.id, currentKey] });
      setEditingId(null);
      setTargetInput("");
    } catch (error) {
      setTargetError(error instanceof Error ? error.message : "Gagal menghapus target.");
    } finally {
      setSavingTarget(false);
    }
  };

  const handleSetRecommendedTarget = async (categoryId: string) => {
    if (!user) return;
    const recommended = recommendedMap.get(categoryId) ?? 0;
    if (recommended <= 0) return;

    try {
      setQuickSavingId(categoryId);
      setTargetError("");
      const response = await fetch("/api/category-budgets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          monthKey: currentKey,
          targetAmount: recommended,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? `HTTP ${response.status}`);
      }
      await queryClient.invalidateQueries({ queryKey: ["category-budgets", user.id, currentKey] });
    } catch (error) {
      console.error("Gagal set rekomendasi:", error);
      setTargetError(error instanceof Error ? error.message : "Gagal menyimpan target.");
    } finally {
      setQuickSavingId(null);
    }
  };

  const handleOpenBulkModal = () => {
    const next: Record<string, string> = {};
    expenseCategories.forEach((category) => {
      const manual = budgetMap.get(category.id);
      next[category.id] = manual !== undefined ? String(Math.round(manual)) : "";
    });
    setDraftTargets(next);
    setBulkError("");
    setShowTargetsModal(true);
  };

  const handleApplyRecommended = () => {
    const next: Record<string, string> = {};
    expenseCategories.forEach((category) => {
      const recommended = recommendedMap.get(category.id) ?? 0;
      next[category.id] = String(Math.round(recommended));
    });
    setDraftTargets(next);
    setBulkError("");
  };

  const handleBulkSave = async () => {
    if (!user) return;
    const upserts: Array<{ categoryId: string; monthKey: string; targetAmount: number }> = [];
    const deletes: string[] = [];

    expenseCategories.forEach((category) => {
      const raw = (draftTargets[category.id] ?? "").trim();
      if (!raw) {
        const existing = budgetRecordMap.get(category.id);
        if (existing) deletes.push(existing.id);
        return;
      }
      const amount = Number(raw.replace(/\D/g, ""));
      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }
      upserts.push({
        categoryId: category.id,
        monthKey: currentKey,
        targetAmount: amount,
      });
    });

    const invalid = expenseCategories.find((category) => {
      const raw = (draftTargets[category.id] ?? "").trim();
      if (!raw) return false;
      const amount = Number(raw.replace(/\D/g, ""));
      return !Number.isFinite(amount) || amount <= 0;
    });

    if (invalid) {
      setBulkError("Pastikan semua target berisi angka yang valid.");
      return;
    }

    try {
      setSavingBulk(true);
      setBulkError("");

      if (upserts.length > 0) {
        const response = await fetch("/api/category-budgets", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: upserts }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error((payload as { error?: string }).error ?? `HTTP ${response.status}`);
        }
      }

      if (deletes.length > 0) {
        const response = await fetch("/api/category-budgets", {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: deletes }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error((payload as { error?: string }).error ?? `HTTP ${response.status}`);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["category-budgets", user.id, currentKey] });
      setShowTargetsModal(false);
    } catch (error) {
      setBulkError(error instanceof Error ? error.message : "Gagal menyimpan target.");
    } finally {
      setSavingBulk(false);
    }
  };

  const handleResetAllTargets = async () => {
    if (!user) return;
    if (budgetsData.length === 0) return;

    const confirmed = window.confirm("Reset semua target manual untuk bulan ini?");
    if (!confirmed) return;

    try {
      setResettingAll(true);
      const response = await fetch(`/api/category-budgets?monthKey=${encodeURIComponent(currentKey)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? `HTTP ${response.status}`);
      }
      await queryClient.invalidateQueries({ queryKey: ["category-budgets", user.id, currentKey] });
    } catch (error) {
      console.error("Gagal reset target:", error);
      window.alert(error instanceof Error ? error.message : "Gagal mereset target.");
    } finally {
      setResettingAll(false);
    }
  };

  const resetGoalForm = () => {
    setGoalName("");
    setGoalTargetInput("");
    setGoalSavedInput("");
    setGoalTargetDate("");
    setGoalError("");
    setEditingGoal(null);
  };

  const startCreateGoal = (preset?: { name: string; target: number; saved?: number; targetDateISO?: string }) => {
    setEditingGoal(null);
    setGoalName(preset?.name ?? "");
    setGoalTargetInput(preset?.target ? String(Math.round(preset.target)) : "");
    setGoalSavedInput(preset?.saved !== undefined ? String(Math.round(preset.saved)) : "");
    setGoalTargetDate(preset?.targetDateISO ?? "");
    setGoalError("");
    setGoalModalOpen(true);
  };

  const startEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalTargetInput(goal.target_amount ? String(Math.round(toNumber(goal.target_amount))) : "");
    setGoalSavedInput(goal.current_amount ? String(Math.round(toNumber(goal.current_amount))) : "");
    setGoalTargetDate(goal.target_date ?? "");
    setGoalError("");
    setGoalModalOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!user) return;
    const name = goalName.trim();
    const targetRaw = goalTargetInput.replace(/\D/g, "");
    const savedRaw = goalSavedInput.replace(/\D/g, "");
    const targetAmount = Number(targetRaw);
    const currentAmount = savedRaw ? Number(savedRaw) : 0;

    if (!name) {
      setGoalError("Nama goal wajib diisi.");
      return;
    }
    if (!targetRaw || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      setGoalError("Target goal harus lebih dari 0.");
      return;
    }
    if (!Number.isFinite(currentAmount) || currentAmount < 0) {
      setGoalError("Progress harus 0 atau lebih.");
      return;
    }

    const payload = {
      name,
      targetAmount,
      currentAmount,
      targetDate: goalTargetDate || null,
    };

    try {
      setSavingGoal(true);
      setGoalError("");

      if (editingGoal) {
        const response = await fetch(`/api/goals/${editingGoal.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? `HTTP ${response.status}`);
        }
      } else {
        const response = await fetch("/api/goals", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? `HTTP ${response.status}`);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["goals", user.id] });
      setGoalModalOpen(false);
      resetGoalForm();
    } catch (error) {
      setGoalError(error instanceof Error ? error.message : "Gagal menyimpan goal.");
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    const confirmed = window.confirm("Hapus goal ini?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${response.status}`);
      }
      await queryClient.invalidateQueries({ queryKey: ["goals", user.id] });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Gagal menghapus goal.");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!user || isAnonymous) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LockWidget message="Anggaran & goals tersedia setelah Anda login." />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Budgets & Goals</h1>
          <p className="mt-2 text-on-surface-variant">Precision tracking for your financial evolution.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            <Link href="/dompet/targets" className="hover:text-primary">
              Lihat histori target
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center rounded-xl border border-outline-variant/10 bg-surface-container-low px-4 py-2 sm:flex">
            <span className="material-symbols-outlined mr-2 text-sm text-primary" data-icon="calendar_month">
              calendar_month
            </span>
            <span className="text-sm font-semibold">{monthLabel}</span>
          </div>
          <button
            type="button"
            onClick={handleResetAllTargets}
            disabled={resettingAll || budgetsData.length === 0}
            className="flex items-center rounded-xl border border-outline-variant/20 px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-60"
          >
            {resettingAll ? "Resetting..." : "Reset Otomatis"}
          </button>
          <button
            type="button"
            onClick={handleOpenBulkModal}
            className="flex items-center space-x-2 rounded-xl bg-surface-container-high px-6 py-3 font-bold text-primary transition-all duration-300 hover:bg-surface-bright"
          >
            <span className="material-symbols-outlined" data-icon="magic_button">
              magic_button
            </span>
            <span>Create New Budget</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="space-y-6 lg:col-span-8">
          <div className="rounded-2xl border border-outline-variant/5 bg-surface-container-low p-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="mb-1 font-headline text-xl font-bold">Monthly Expenditure</h2>
                <p className="text-sm text-on-surface-variant">Real-time consumption across core categories.</p>
              </div>
              <div className="text-right">
                <span className="block font-headline text-2xl font-bold">
                  <SensitiveCurrency value={totalRemaining} eyeClassName="h-7 w-7" />
                </span>
                <span className="text-xs font-medium uppercase tracking-widest text-slate-500">Total Remaining</span>
              </div>
            </div>

            <div className="space-y-10">
              {loading ? (
                <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-6 text-sm text-on-surface-variant">
                  Memuat data anggaran terbaru...
                </div>
              ) : categories.length === 0 ? (
                <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-6 text-sm text-on-surface-variant">
                  <p className="text-base font-semibold text-on-surface">Belum ada kategori.</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Tambahkan kategori pengeluaran agar sistem bisa menyusun target anggaran.
                  </p>
                  <Link
                    href="/categories"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary"
                  >
                    Kelola Kategori
                  </Link>
                </div>
              ) : (
                <>
                  {transactions.length === 0 ? (
                    <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-6 text-sm text-on-surface-variant">
                      <p className="text-base font-semibold text-on-surface">Belum ada transaksi.</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Anda tetap bisa mengatur target bulanan untuk tiap kategori.
                      </p>
                      <Link
                        href="/transactions"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary"
                      >
                        Tambah Transaksi
                      </Link>
                    </div>
                  ) : null}

                  {budgetRows.length ? (
                    budgetRows.map((row) => {
                      const style = statusStyles[row.status];
                      const percentLabel = `${Math.round(row.percent * 100)}% Consumed`;
                      const hasManualTarget = budgetMap.has(row.id);
                      const recommended = recommendedMap.get(row.id) ?? 0;
                      const canRecommend = recommended > 0;
                      const previewTarget = targetInput ? (
                        <SensitiveCurrency
                          value={Number(targetInput.replace(/\D/g, ""))}
                          eyeClassName="h-6 w-6"
                          wrapperClassName="gap-1"
                        />
                      ) : (
                        <SensitiveCurrency value={row.budget} eyeClassName="h-6 w-6" wrapperClassName="gap-1" />
                      );
                      return (
                        <div key={row.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface">
                                <span className="material-symbols-outlined" data-icon={row.icon}>
                                  {row.icon}
                                </span>
                              </div>
                              <span className="text-lg font-bold">{row.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="flex flex-wrap items-center justify-end gap-2 text-lg font-bold text-on-surface">
                                <SensitiveCurrency value={row.spent} eyeClassName="h-6 w-6" wrapperClassName="gap-1" />
                                <span className="text-sm font-medium text-on-surface-variant">/</span>
                                <SensitiveCurrency
                                  value={row.budget}
                                  className="text-on-surface-variant"
                                  eyeClassName="h-6 w-6 border-transparent bg-transparent hover:bg-surface-container"
                                  wrapperClassName="gap-1"
                                />
                              </div>
                              <div className="text-xs text-on-surface-variant">
                                Rekomendasi: <SensitiveCurrency value={recommended} eyeClassName="h-6 w-6" wrapperClassName="gap-1" />
                              </div>
                            </div>
                          </div>
                          <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-container">
                            <ProgressBar percent={row.percent} className={style.bar} />
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                            <span>{percentLabel}</span>
                            <div className="flex flex-wrap items-center gap-2">
                              {hasManualTarget ? (
                                <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-[10px] uppercase tracking-wider text-on-surface-variant">
                                  Manual
                                </span>
                              ) : null}
                              <span className={style.text}>{style.label}</span>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(row.id)}
                                className="rounded-full border border-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
                              >
                                {hasManualTarget ? "Ubah Target" : "Set Target"}
                              </button>
                              {canRecommend ? (
                                <button
                                  type="button"
                                  disabled={quickSavingId === row.id}
                                  onClick={() => handleSetRecommendedTarget(row.id)}
                                  className="rounded-full border border-secondary/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-secondary/10 disabled:opacity-60"
                                >
                                  {quickSavingId === row.id ? "Menyimpan..." : "Set Rekomendasi"}
                                </button>
                              ) : null}
                              {hasManualTarget ? (
                                <button
                                  type="button"
                                  disabled={savingTarget}
                                  onClick={() => {
                                    if (savingTarget) return;
                                    const confirmed = window.confirm("Reset target manual ke otomatis?");
                                    if (!confirmed) return;
                                    handleDeleteTarget(row.id);
                                  }}
                                  className="rounded-full border border-outline-variant/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary/30 hover:text-primary"
                                >
                                  Reset Otomatis
                                </button>
                              ) : null}
                            </div>
                          </div>
                          {editingId === row.id ? (
                            <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-4">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex-1 space-y-1">
                                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                    Target Bulan Ini
                                  </label>
                                  <input
                                    value={targetInput}
                                    onChange={(event) => setTargetInput(event.target.value.replace(/\D/g, ""))}
                                    placeholder="Contoh: 1500000"
                                    className="w-full rounded-lg border border-outline-variant/10 bg-surface-container-high px-3 py-2 text-sm text-on-surface"
                                    disabled={savingTarget}
                                  />
                                  <p className="text-xs text-on-surface-variant">
                                    Preview: <span className="inline-flex items-center">{previewTarget}</span>
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveTarget(row.id)}
                                    disabled={savingTarget}
                                    className="rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-primary"
                                  >
                                    {savingTarget ? "Menyimpan..." : "Simpan"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(null);
                                      setTargetInput("");
                                      setTargetError("");
                                    }}
                                    disabled={savingTarget}
                                    className="rounded-lg border border-outline-variant/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
                                  >
                                    Batal
                                  </button>
                                  {hasManualTarget ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTarget(row.id)}
                                      disabled={savingTarget}
                                      className="rounded-lg border border-error/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-error hover:bg-error/10"
                                    >
                                      Hapus Target
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                              {targetError ? (
                                <p className="mt-2 text-xs text-error">{targetError}</p>
                              ) : (
                                <p className="mt-2 text-xs text-on-surface-variant">
                                  Target berlaku untuk {monthLabel}.
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-6 text-sm text-on-surface-variant">
                      Belum ada kategori pengeluaran untuk ditampilkan.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6 lg:col-span-4">
          <div className="h-full rounded-2xl border border-outline-variant/5 bg-surface-container-low p-8">
            <h2 className="mb-6 font-headline text-xl font-bold">Active Savings Goals</h2>
            <div className="space-y-8">
              {goalsLoading ? (
                <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-6 text-sm text-on-surface-variant">
                  Memuat goals...
                </div>
              ) : activeGoals.length ? (
                activeGoals.map((goal) => {
                  const strokeClass =
                    goal.accent === "primary"
                      ? "text-primary"
                      : goal.accent === "tertiary"
                        ? "text-tertiary"
                        : "text-secondary";
                  const ringOffset = CIRCLE_CIRCUMFERENCE * (1 - Math.min(goal.percent, 1));

                  return (
                    <div
                      key={goal.id}
                      className="flex flex-col items-center rounded-2xl bg-surface-container p-6 text-center transition-transform hover:scale-[1.02]"
                    >
                      <div className="relative mb-4 h-32 w-32">
                        <svg className="h-full w-full -rotate-90 transform">
                          <circle
                            className="text-surface-container-highest"
                            cx="64"
                            cy="64"
                            r={CIRCLE_RADIUS}
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                          />
                          <circle
                            className={strokeClass}
                            cx="64"
                            cy="64"
                            r={CIRCLE_RADIUS}
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeDasharray={CIRCLE_CIRCUMFERENCE}
                            strokeDashoffset={ringOffset}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-headline text-2xl font-extrabold tnum">
                            {Math.round(goal.percent * 100)}%
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold">{goal.name}</h3>
                      <p className="mb-3 text-sm text-on-surface-variant">Target: {goal.targetDate}</p>
                      {goal.isSuggested ? (
                        <span className="mb-4 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                          Rekomendasi
                        </span>
                      ) : null}
                      <div className="w-full border-t border-outline-variant/10 pt-4">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                          <span className={strokeClass}>
                            <SensitiveCurrency
                              value={goal.saved}
                              className={strokeClass}
                              eyeClassName="h-6 w-6 border-transparent bg-transparent hover:bg-surface-container"
                              wrapperClassName="gap-1"
                            />{" "}
                            Saved
                          </span>
                          <span className="text-on-surface-variant">
                            <SensitiveCurrency
                              value={goal.target}
                              className="text-on-surface-variant"
                              eyeClassName="h-6 w-6 border-transparent bg-transparent hover:bg-surface-container"
                              wrapperClassName="gap-1"
                            />{" "}
                            Goal
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                        {goal.isSuggested ? (
                          <button
                            type="button"
                            onClick={() =>
                              startCreateGoal({
                                name: goal.name,
                                target: goal.target,
                                saved: goal.saved,
                                targetDateISO: goal.targetDateISO,
                              })
                            }
                            className="rounded-full border border-primary/30 px-3 py-1 text-primary transition-colors hover:bg-primary/10"
                          >
                            Gunakan
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => goal.source && startEditGoal(goal.source)}
                              className="rounded-full border border-outline-variant/30 px-3 py-1 text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="rounded-full border border-error/30 px-3 py-1 text-error transition-colors hover:bg-error/10"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-6 text-sm text-on-surface-variant">
                  Belum ada goal aktif. Tambahkan goal baru untuk mulai melacak progress tabungan.
                </div>
              )}

              <button
                type="button"
                onClick={() => startCreateGoal()}
                className="flex w-full items-center justify-center space-x-2 rounded-xl border-2 border-dashed border-outline-variant/30 py-4 font-bold text-on-surface-variant transition-all hover:border-primary hover:text-primary"
              >
                <span className="material-symbols-outlined" data-icon="add">
                  add
                </span>
                <span>Define New Goal</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      <section>
        <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-[#161c26] to-[#0e141d] p-8">
          <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="max-w-2xl">
              <span className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                Smart Suggestion
              </span>
              <h3 className="mb-3 font-headline text-2xl font-bold text-on-surface">{suggestion.headline}</h3>
              <p className="leading-relaxed text-on-surface-variant">{suggestion.detail}</p>
            </div>
            <button
              type="button"
              className="whitespace-nowrap rounded-2xl bg-on-surface px-8 py-4 font-bold text-surface transition-colors hover:bg-primary"
            >
              Auto-Transfer Now
            </button>
          </div>
        </div>
      </section>

      <Modal
        open={showTargetsModal}
        title={`Target Bulanan • ${monthLabel}`}
        onClose={() => setShowTargetsModal(false)}
        sizeClassName="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--text-dimmed)]">
                Atur target pengeluaran per kategori. Kosongkan input untuk kembali ke mode otomatis.
              </p>
            </div>
            <button
              type="button"
              onClick={handleApplyRecommended}
              className="rounded-lg border border-primary/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10"
            >
              Gunakan rekomendasi
            </button>
          </div>

          {expenseCategories.length === 0 ? (
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm text-on-surface-variant">
              Belum ada kategori pengeluaran. Tambahkan kategori terlebih dahulu.
            </div>
          ) : (
            <div className="grid gap-3">
              {expenseCategories.map((category) => {
                const spent = currentSpendMap.get(category.id) ?? 0;
                const recommended = recommendedMap.get(category.id) ?? 0;
                const manual = budgetMap.get(category.id);
                return (
                  <div
                    key={category.id}
                    className="flex flex-col gap-3 rounded-xl border border-outline-variant/10 bg-surface-container p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-on-surface">{category.name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                        <span className="inline-flex items-center gap-1">
                          Terpakai: <SensitiveCurrency value={spent} eyeClassName="h-6 w-6" wrapperClassName="gap-1" />
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="inline-flex items-center gap-1">
                          Rekomendasi:{" "}
                          <SensitiveCurrency value={recommended} eyeClassName="h-6 w-6" wrapperClassName="gap-1" />
                        </span>
                        {manual !== undefined ? (
                          <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                            Manual
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:items-center">
                      <input
                        value={draftTargets[category.id] ?? ""}
                        onChange={(event) =>
                          setDraftTargets((prev) => ({
                            ...prev,
                            [category.id]: event.target.value.replace(/\D/g, ""),
                          }))
                        }
                        placeholder={recommended ? String(Math.round(recommended)) : "Target baru"}
                        className="w-full rounded-lg border border-outline-variant/10 bg-surface-container-high px-3 py-2 text-sm text-on-surface md:w-48"
                        disabled={savingBulk}
                      />
                      <span className="text-xs text-on-surface-variant">
                        {draftTargets[category.id] ? (
                          <SensitiveCurrency
                            value={Number(draftTargets[category.id].replace(/\D/g, ""))}
                            eyeClassName="h-6 w-6"
                            wrapperClassName="gap-1"
                          />
                        ) : (
                          "Mode otomatis"
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {bulkError ? <p className="text-xs text-error">{bulkError}</p> : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowTargetsModal(false)}
              className="rounded-lg border border-outline-variant/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
              disabled={savingBulk}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleBulkSave}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-primary"
              disabled={savingBulk}
            >
              {savingBulk ? "Menyimpan..." : "Simpan Semua"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={goalModalOpen}
        title={editingGoal ? "Edit Goal" : "Buat Goal Baru"}
        onClose={() => {
          setGoalModalOpen(false);
          resetGoalForm();
        }}
        sizeClassName="max-w-xl"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Nama Goal</label>
            <input
              value={goalName}
              onChange={(event) => setGoalName(event.target.value)}
              placeholder="Contoh: Dana Darurat"
              className="w-full rounded-lg border border-outline-variant/10 bg-surface-container-high px-3 py-2 text-sm text-on-surface"
              disabled={savingGoal}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Target Nominal</label>
            <input
              value={goalTargetInput}
              onChange={(event) => setGoalTargetInput(event.target.value.replace(/\D/g, ""))}
              placeholder="Contoh: 10000000"
              className="w-full rounded-lg border border-outline-variant/10 bg-surface-container-high px-3 py-2 text-sm text-on-surface"
              disabled={savingGoal}
            />
            <p className="text-xs text-on-surface-variant">
              Preview:{" "}
              {goalTargetInput ? (
                <SensitiveCurrency value={Number(goalTargetInput.replace(/\D/g, ""))} eyeClassName="h-6 w-6" wrapperClassName="gap-1" />
              ) : (
                "-"
              )}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Progress Saat Ini</label>
            <input
              value={goalSavedInput}
              onChange={(event) => setGoalSavedInput(event.target.value.replace(/\D/g, ""))}
              placeholder="Contoh: 2500000"
              className="w-full rounded-lg border border-outline-variant/10 bg-surface-container-high px-3 py-2 text-sm text-on-surface"
              disabled={savingGoal}
            />
            <p className="text-xs text-on-surface-variant">
              Preview:{" "}
              {goalSavedInput ? (
                <SensitiveCurrency value={Number(goalSavedInput.replace(/\D/g, ""))} eyeClassName="h-6 w-6" wrapperClassName="gap-1" />
              ) : (
                "-"
              )}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Target Tanggal</label>
            <input
              type="date"
              value={goalTargetDate}
              onChange={(event) => setGoalTargetDate(event.target.value)}
              className="w-full rounded-lg border border-outline-variant/10 bg-surface-container-high px-3 py-2 text-sm text-on-surface"
              disabled={savingGoal}
            />
          </div>

          {goalError ? <p className="text-xs text-error">{goalError}</p> : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setGoalModalOpen(false);
                resetGoalForm();
              }}
              className="rounded-lg border border-outline-variant/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
              disabled={savingGoal}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveGoal}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-primary"
              disabled={savingGoal}
            >
              {savingGoal ? "Menyimpan..." : "Simpan Goal"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
