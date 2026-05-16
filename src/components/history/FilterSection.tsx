"use client";

import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useTransactionStore } from "@/stores/transactionStore";
import { useUIStore } from "@/stores/uiStore";
import { getMonthLabel } from "@/utils/date";
import { useWalletStore } from "@/stores/walletStore";

export default function FilterSection() {
  const dateRange = useTransactionStore((state) => state.dateRange);
  const setDateRange = useTransactionStore((state) => state.setDateRange);
  const currentMonth = useTransactionStore((state) => state.currentMonth);
  const prevMonth = useTransactionStore((state) => state.prevMonth);
  const nextMonth = useTransactionStore((state) => state.nextMonth);
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);
  const openModal = useUIStore((state) => state.openModal);

  const now = new Date();
  const isFuture = currentMonth.year > now.getFullYear() ||
    (currentMonth.year === now.getFullYear() && currentMonth.month >= now.getMonth() + 1);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={dateRange === "daily" ? "primary" : "outline"}
          onClick={() => setDateRange("daily")}
          className="flex-1"
        >
          Harian
        </Button>
        <Button
          variant={dateRange === "monthly" ? "primary" : "outline"}
          onClick={() => setDateRange("monthly")}
          className="flex-1"
        >
          Bulanan
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[var(--bg-card)] px-3 py-2">
        <Button variant="ghost" onClick={prevMonth}>
          <ChevronLeft size={18} />
        </Button>
        <span className="text-sm text-[var(--text-primary)]">
          {getMonthLabel(currentMonth.year, currentMonth.month)}
        </span>
        <Button variant="ghost" onClick={nextMonth} disabled={isFuture}>
          <ChevronRight size={18} />
        </Button>
      </div>

      <button
        onClick={() => openModal("walletSelection")}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-[var(--bg-card)] px-4 py-2 text-xs text-[var(--text-primary)]"
      >
        <Filter size={14} />
        Filter Dompet
        {selectedWalletIds.length ? <Badge>{selectedWalletIds.length}</Badge> : null}
      </button>
    </div>
  );
}
