"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import TransactionForm from "@/components/shared/TransactionForm";
import { useUIStore } from "@/stores/uiStore";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import type { Transaction } from "@/types/transaction";
import { useAuth } from "@/hooks/useAuth";

export default function QuickAddTransactionModal() {
  const open = useUIStore((state) => state.modals.quickAddTransaction);
  const closeModal = useUIStore((state) => state.closeModal);
  const pushToast = useUIStore((state) => state.pushToast);
  const { user, isAnonymous } = useAuth();
  const categories = useBudgetStore((state) => state.categories);
  const wallets = useBudgetStore((state) => state.wallets);
  const loading = useBudgetStore((state) => state.loading);
  const [saving, setSaving] = useState(false);
  const canManageWallets = Boolean(user) && !isAnonymous;

  const handleSubmit = async (payload: Omit<Transaction, "id">) => {
    try {
      setSaving(true);
      await budgetActions.addTransaction(payload);
      pushToast({ title: "Transaksi tersimpan", variant: "success" });
      closeModal("quickAddTransaction");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
      pushToast({ title: "Gagal menambah transaksi", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Catat Transaksi"
      onClose={() => closeModal("quickAddTransaction")}
      sizeClassName="max-w-4xl"
    >
      <TransactionForm
        categories={categories}
        wallets={wallets}
        onSubmit={handleSubmit}
        onCreateWallet={canManageWallets ? (payload) => budgetActions.addWallet(payload) : undefined}
        onCancel={() => closeModal("quickAddTransaction")}
        disabled={loading || saving}
      />
    </Modal>
  );
}
