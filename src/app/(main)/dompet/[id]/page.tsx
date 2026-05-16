"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import TransactionList from "@/components/history/TransactionList";
import LockWidget from "@/components/LockWidget";
import AddTransactionDialog from "@/components/transactions/AddTransactionDialog";
import { useWallets } from "@/hooks/useWallets";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { useTransactionStore } from "@/stores/transactionStore";
import { useUIStore } from "@/stores/uiStore";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import { getMonthLabel } from "@/utils/date";

export default function WalletDetailPage() {
  const params = useParams();
  const walletId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { wallets } = useWallets();
  const { user, isAnonymous, loading: authLoading } = useAuth();
  const { query } = useTransactions({ walletId });
  const transactions = useTransactionStore((state) => state.transactions);
  const dateRange = useTransactionStore((state) => state.dateRange);
  const setDateRange = useTransactionStore((state) => state.setDateRange);
  const currentMonth = useTransactionStore((state) => state.currentMonth);
  const prevMonth = useTransactionStore((state) => state.prevMonth);
  const nextMonth = useTransactionStore((state) => state.nextMonth);
  const openModal = useUIStore((state) => state.openModal);
  const pushToast = useUIStore((state) => state.pushToast);

  useEffect(() => {
    if (query.error) {
      pushToast({
        title: "Gagal memuat transaksi",
        description: "Periksa koneksi Anda lalu coba lagi.",
        variant: "error",
      });
    }
  }, [query.error, pushToast]);

  const wallet = useMemo(
    () => wallets.find((item) => item.id === walletId),
    [walletId, wallets],
  );

  const now = new Date();
  const isFuture =
    currentMonth.year > now.getFullYear() ||
    (currentMonth.year === now.getFullYear() && currentMonth.month >= now.getMonth() + 1);

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
        <LockWidget message="Detail dompet tersedia setelah Anda login." />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-[var(--text-dimmed)]">
        Dompet tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="grid gap-6 desktop:grid-cols-[360px_1fr]">
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 p-6 text-white">
          <p className="text-xs text-white/70">Saldo Dompet</p>
          <p className="text-3xl font-semibold">
            <SensitiveCurrency value={Number(wallet.balance ?? 0)} className="text-white" eyeClassName="h-8 w-8 border-white/20 bg-white/10 hover:bg-white/15" />
          </p>
          <div className="mt-4 flex gap-2">
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
        </div>

        {dateRange === "monthly" ? (
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
        ) : null}
      </div>

      <div className="space-y-4">
        <TransactionList
          transactions={transactions}
          loading={query.isLoading}
          error={query.error}
          onRetry={() => query.refetch()}
        />
      </div>

      <button
        className="fixed bottom-20 right-6 flex items-center gap-2 rounded-full bg-[var(--accent-indigo)] px-4 py-3 text-sm font-semibold text-white shadow-2xl tablet:bottom-24 desktop:bottom-8"
        onClick={() => openModal("addTransaction")}
      >
        <Plus size={18} />
        Transaksi
      </button>

      <AddTransactionDialog walletId={wallet.id} />
    </div>
  );
}
