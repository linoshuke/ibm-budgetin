import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import { useWalletStore } from "@/stores/walletStore";
import type { Wallet } from "@/types/wallet";

export function useWallets() {
  const { isAnonymous } = useAuth();
  const wallets = useBudgetStore((state) => state.wallets) as Wallet[];
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);
  const setTotalBalance = useWalletStore((state) => state.setTotalBalance);

  useEffect(() => {
    const ids = selectedWalletIds.length ? selectedWalletIds : wallets.map((wallet) => wallet.id);
    const total = wallets
      .filter((wallet) => ids.includes(wallet.id))
      .reduce((acc, wallet) => acc + Number(wallet.balance ?? 0), 0);
    setTotalBalance(total);
  }, [wallets, selectedWalletIds, setTotalBalance]);

  const createWallet = async (payload: Pick<Wallet, "name" | "category" | "location">) => {
    await budgetActions.addWallet(payload);
  };

  const deleteWallet = async (walletId: string) => {
    await budgetActions.deleteWallet(walletId);
  };

  const updateWallet = async (
    walletId: string,
    changes: Pick<Wallet, "name"> & Partial<Pick<Wallet, "category" | "location">>,
  ) => {
    await budgetActions.updateWallet(walletId, changes);
  };

  const selectedWallets = useMemo(() => {
    if (!selectedWalletIds.length) return wallets;
    return wallets.filter((wallet) => selectedWalletIds.includes(wallet.id));
  }, [selectedWalletIds, wallets]);

  return {
    wallets,
    selectedWallets,
    selectedWalletIds,
    isAnonymous,
    createWallet,
    deleteWallet,
    updateWallet,
  };
}
