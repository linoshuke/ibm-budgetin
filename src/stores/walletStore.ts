import { create } from "zustand";
import type { Wallet } from "@/types";

interface WalletState {
  wallets: Wallet[];
  selectedWalletIds: string[];
  totalBalance: number;
  setWallets: (wallets: Wallet[]) => void;
  setSelectedWalletIds: (ids: string[]) => void;
  toggleWallet: (id: string) => void;
  setTotalBalance: (total: number) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  selectedWalletIds: [],
  totalBalance: 0,
  setWallets: (wallets) => set({ wallets }),
  setSelectedWalletIds: (ids) => set({ selectedWalletIds: ids }),
  toggleWallet: (id) => {
    const current = get().selectedWalletIds;
    const exists = current.includes(id);
    const next = exists ? current.filter((item) => item !== id) : [...current, id];
    set({ selectedWalletIds: next });
  },
  setTotalBalance: (total) => set({ totalBalance: total }),
}));
