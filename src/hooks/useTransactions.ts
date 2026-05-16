import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTransactionStore, type DateRange } from "@/stores/transactionStore";
import { useWalletStore } from "@/stores/walletStore";
import type { MonthlySummary, Transaction } from "@/types";
import { getMonthRange } from "@/utils/date";

interface TransactionQueryOptions {
  walletId?: string;
  dateRange?: DateRange;
  month?: { year: number; month: number };
}

export function useTransactions(options: TransactionQueryOptions = {}) {
  const { user, isAnonymous } = useAuth();
  const { dateRange, currentMonth, setTransactions } = useTransactionStore();
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);

  const range = options.dateRange ?? dateRange;
  const month = options.month ?? currentMonth;
  const walletIds = options.walletId ? [options.walletId] : selectedWalletIds;

  const query = useQuery({
    queryKey: [
      "transactions",
      options.walletId ?? "all",
      walletIds.join("-"),
      range,
      month.year,
      month.month,
      user?.id ?? "anon",
    ],
    queryFn: async () => {
      const { start, end } = getMonthRange(month.year, month.month);
      if (!user) return [];

      const params = new URLSearchParams({
        limit: "300",
        offset: "0",
        dateFrom: start,
        dateTo: end,
      });
      if (walletIds.length) {
        params.set("walletIds", walletIds.join(","));
      }

      const response = await fetch(`/api/transactions?${params.toString()}`, { 
        credentials: "include", 
      }); 
      if (!response.ok) { 
        throw new Error(`HTTP ${response.status}`); 
      } 
      const payload = (await response.json()) as {
        items: Array<{
          id: string;
          type: Transaction["type"];
          amount: number;
          categoryId?: string | null;
          walletId?: string | null;
          date: string;
          note?: string | null;
        }>;
      };
      const items = payload.items ?? [];
      return items.map((item) => ({
        id: item.id,
        wallet_id: item.walletId ?? "",
        user_id: user.id,
        description: item.note ?? "",
        amount: Number(item.amount ?? 0),
        type: item.type,
        date: item.date,
        created_at: item.date,
        category_id: item.categoryId ?? null,
      })) as Transaction[];
    },
  });

  useEffect(() => {
    if (query.data) {
      setTransactions(query.data);
    }
  }, [query.data, setTransactions]);

  return {
    query,
    dateRange: range,
    currentMonth: month,
    walletIds,
    isAnonymous,
  };
}

export function useMonthlySummary(
  walletIds: string[] = [],
  monthOverride?: { year: number; month: number },
) {
  const { user } = useAuth();
  const { currentMonth } = useTransactionStore();
  const activeMonth = monthOverride ?? currentMonth;

  return useQuery({
    queryKey: ["monthlySummary", user?.id ?? "anon", activeMonth.year, activeMonth.month, walletIds.join("-")],
    queryFn: async () => {
      if (!user) return { total_income: 0, total_expense: 0 };

      const params = new URLSearchParams({
        year: String(activeMonth.year),
        month: String(activeMonth.month),
      });
      if (walletIds.length) {
        params.set("walletIds", walletIds.join(","));
      }

      const response = await fetch(`/api/monthly-summary?${params.toString()}`, { 
        credentials: "include", 
      }); 
      if (!response.ok) { 
        throw new Error(`HTTP ${response.status}`); 
      } 
      const summary = (await response.json()) as MonthlySummary[];
      const totalIncome = summary.reduce((acc, item) => acc + Number(item.total_income ?? 0), 0);
      const totalExpense = summary.reduce((acc, item) => acc + Number(item.total_expense ?? 0), 0);

      return { total_income: totalIncome, total_expense: totalExpense };
    },
  });
}

export function useExpenseByCategory(walletIds: string[] = []) {
  const { user } = useAuth();
  const { currentMonth } = useTransactionStore();
  const { start, end } = getMonthRange(currentMonth.year, currentMonth.month);

  return useQuery({
    queryKey: ["expenseByCategory", user?.id ?? "anon", currentMonth.year, currentMonth.month, walletIds.join("-")],
    queryFn: async () => {
      if (!user) return [];

      const params = new URLSearchParams({
        limit: "100",
        offset: "0",
        dateFrom: start,
        dateTo: end,
        type: "expense",
      });
      if (walletIds.length) {
        params.set("walletIds", walletIds.join(","));
      }

      const response = await fetch(`/api/transactions?${params.toString()}`, { 
        credentials: "include", 
      }); 
      if (!response.ok) { 
        throw new Error(`HTTP ${response.status}`); 
      } 
      const payload = (await response.json()) as {
        items: Array<{
          id: string;
          type: Transaction["type"];
          amount: number;
          categoryId?: string | null;
          walletId?: string | null;
          date: string;
          note?: string | null;
        }>;
      };
      const data = payload.items ?? [];

      const totals: Record<string, number> = {};
      (data ?? []).forEach((item) => {
        const label = item.note?.trim();
        const key = label ? label : "Lainnya";
        totals[key] = (totals[key] ?? 0) + Number(item.amount ?? 0);
      });

      return Object.entries(totals).map(([name, value]) => ({ name, value }));
    },
  });
}
