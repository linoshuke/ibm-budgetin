"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { useWalletStore } from "@/stores/walletStore";
import { useUIStore } from "@/stores/uiStore";
import { useWallets } from "@/hooks/useWallets";

export default function WalletSelectionDialog() {
  const { wallets } = useWallets();
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);
  const setSelectedWalletIds = useWalletStore((state) => state.setSelectedWalletIds);
  const open = useUIStore((state) => state.modals.walletSelection);
  const closeModal = useUIStore((state) => state.closeModal);
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setTempSelected(selectedWalletIds);
    }
  }, [open, selectedWalletIds]);

  const toggle = (id: string) => {
    setTempSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const reset = () => setTempSelected([]);

  const apply = () => {
    setSelectedWalletIds(tempSelected);
    closeModal("walletSelection");
  };

  return (
    <Dialog open={open} onOpenChange={() => closeModal("walletSelection")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pilih Dompet</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <label key={wallet.id} className="flex items-center gap-3 text-sm">
              <Checkbox checked={tempSelected.includes(wallet.id)} onChange={() => toggle(wallet.id)} />
              <span className="text-[var(--text-primary)]">{wallet.name}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
          <Button onClick={apply}>Terapkan</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
