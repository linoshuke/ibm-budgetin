import { monthKey } from "@/lib/utils";
import type { Category } from "@/types/category";
import type { Transaction, TransactionType } from "@/types/transaction";

export interface Totals {
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryBreakdown {
  category: Category;
  amount: number;
  count: number;
  percent: number;
}

export function calculateTotals(transactions: Transaction[]): Totals {
  let income = 0;
  let expense = 0;

  transactions.forEach((item) => {
    if (item.type === "income") income += item.amount;
    if (item.type === "expense") expense += item.amount;
  });

  return {
    income,
    expense,
    balance: income - expense,
  };
}

export function sortTransactionsByDate(transactions: Transaction[]) {
  const decorated = transactions.map((transaction, index) => {
    const timestamp = Date.parse(transaction.date);
    return {
      index,
      timestamp: Number.isFinite(timestamp) ? timestamp : 0,
      transaction,
    };
  });

  decorated.sort((a, b) => {
    const diff = b.timestamp - a.timestamp;
    if (diff !== 0) return diff;
    return a.index - b.index;
  });

  return decorated.map((item) => item.transaction);
}

export function getRecentTransactions(transactions: Transaction[], limit = 8) {
  return sortTransactionsByDate(transactions).slice(0, limit);
}

export function filterTransactionsByMonth(transactions: Transaction[], targetMonth: string) {
  return transactions.filter((item) => monthKey(item.date) === targetMonth);
}

export function filterTransactionsByDateRange(
  transactions: Transaction[],
  fromDate?: string,
  toDate?: string,
) {
  const from = fromDate ? new Date(fromDate).getTime() : Number.NEGATIVE_INFINITY;
  const to = toDate ? new Date(toDate).getTime() : Number.POSITIVE_INFINITY;

  return transactions.filter((item) => {
    const timestamp = Date.parse(item.date);
    if (!Number.isFinite(timestamp)) return false;
    return timestamp >= from && timestamp <= to;
  });
}

export function summarizeByCategory(
  transactions: Transaction[],
  categories: Category[],
  type: TransactionType = "expense",
) {
  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  const grouped = new Map<string, { amount: number; count: number }>();

  transactions
    .filter((item) => item.type === type)
    .forEach((item) => {
      const record = grouped.get(item.categoryId);
      if (!record) {
        grouped.set(item.categoryId, { amount: item.amount, count: 1 });
        return;
      }
      grouped.set(item.categoryId, {
        amount: record.amount + item.amount,
        count: record.count + 1,
      });
    });

  const total = [...grouped.values()].reduce((sum, item) => sum + item.amount, 0);
  const fallback: Category = {
    id: "other",
    name: "Lainnya",
    icon: "MISC",
    color: "#64748b",
    type: "both",
    isDefault: true,
  };

  return [...grouped.entries()]
    .map(([categoryId, data]) => {
      const category = categoryMap.get(categoryId) ?? fallback;
      return {
        category,
        amount: data.amount,
        count: data.count,
        percent: total > 0 ? Math.round((data.amount / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}
