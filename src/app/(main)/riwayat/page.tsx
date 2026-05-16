"use client";

import { useEffect } from "react";
import FilterSection from "@/components/history/FilterSection";
import TransactionList from "@/components/history/TransactionList";
import LockWidget from "@/components/LockWidget";
import WalletSelectionDialog from "@/components/modals/WalletSelectionDialog";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { useTransactionStore } from "@/stores/transactionStore";
import { useUIStore } from "@/stores/uiStore";

export default function HistoryPage() {
  const { isAnonymous } = useAuth();
  const { query } = useTransactions();
  const transactions = useTransactionStore((state) => state.transactions);
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

  if (isAnonymous) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LockWidget message="Riwayat lengkap tersedia setelah Anda login." />
      </div>
    );
  }

  return (
    <div className="grid gap-6 desktop:grid-cols-[280px_1fr]">
      <div className="space-y-4 desktop:sticky desktop:top-24">
        <FilterSection />
      </div>
      <div>
        <TransactionList
          transactions={transactions}
          loading={query.isLoading}
          error={query.error}
          onRetry={() => query.refetch()}
        />
      </div>
      <WalletSelectionDialog />
    </div>
  );
}
