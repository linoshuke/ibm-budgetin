import { useMemo } from "react";
import { useBudgetStore } from "@/store/budgetStore";
import {
  calculateTotals,
  filterTransactionsByMonth,
  getRecentTransactions,
  summarizeByCategory,
} from "@/lib/budget";
import { monthKey } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

type DashboardDataOptions = {
  walletIds?: string[];
  transactions?: Transaction[];
};

export function useDashboardData(options: DashboardDataOptions = {}) {
  const storeTransactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const wallets = useBudgetStore((state) => state.wallets);

  const baseTransactions = options.transactions ?? storeTransactions;
  const filteredTransactions = useMemo(() => {
    if (!options.walletIds || options.walletIds.length === 0) return baseTransactions;
    return baseTransactions.filter((item) => options.walletIds?.includes(item.walletId));
  }, [baseTransactions, options.walletIds]);

  const totals = useMemo(() => calculateTotals(filteredTransactions), [filteredTransactions]);
  const activeMonth = monthKey(new Date());
  const monthTransactions = useMemo(
    () => filterTransactionsByMonth(filteredTransactions, activeMonth),
    [filteredTransactions, activeMonth],
  );
  const monthTotals = useMemo(() => calculateTotals(monthTransactions), [monthTransactions]);
  const monthIncomeCount = useMemo(
    () => monthTransactions.filter((item) => item.type === "income").length,
    [monthTransactions],
  );
  const monthExpenseCount = useMemo(
    () => monthTransactions.filter((item) => item.type === "expense").length,
    [monthTransactions],
  );
  const recent = useMemo(() => getRecentTransactions(filteredTransactions, 8), [filteredTransactions]);
  const expenseRows = useMemo(
    () => summarizeByCategory(monthTransactions, categories, "expense"),
    [monthTransactions, categories],
  );

  return {
    categories,
    wallets,
    totals,
    monthTotals,
    monthIncomeCount,
    monthExpenseCount,
    recent,
    expenseRows,
  };
}
