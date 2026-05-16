import { create } from "zustand";
import type { Transaction } from "@/types";

export type DateRange = "daily" | "monthly";

interface TransactionState {
  transactions: Transaction[];
  dateRange: DateRange;
  currentMonth: { year: number; month: number };
  setTransactions: (transactions: Transaction[]) => void;
  setDateRange: (range: DateRange) => void;
  setCurrentMonth: (value: { year: number; month: number }) => void;
  prevMonth: () => void;
  nextMonth: () => void;
}

const now = new Date();

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  dateRange: "daily",
  currentMonth: { year: now.getFullYear(), month: now.getMonth() + 1 },
  setTransactions: (transactions) => set({ transactions }),
  setDateRange: (range) => set({ dateRange: range }),
  setCurrentMonth: (value) => set({ currentMonth: value }),
  prevMonth: () => {
    const { year, month } = get().currentMonth;
    const date = new Date(year, month - 2, 1);
    set({ currentMonth: { year: date.getFullYear(), month: date.getMonth() + 1 } });
  },
  nextMonth: () => {
    const { year, month } = get().currentMonth;
    const date = new Date(year, month, 1);
    set({ currentMonth: { year: date.getFullYear(), month: date.getMonth() + 1 } });
  },
}));
