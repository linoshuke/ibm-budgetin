import { useState } from "react";

export function useWalletFilter(initialIds: string[] = []) {
  const [open, setOpen] = useState(false);
  const [selectedWalletIds, setSelectedWalletIds] = useState<string[]>(initialIds);
  const [draftWalletIds, setDraftWalletIds] = useState<string[]>(initialIds);

  const openFilter = () => {
    setDraftWalletIds(selectedWalletIds);
    setOpen(true);
  };

  const toggleWallet = (id: string) => {
    setDraftWalletIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const applyFilter = () => {
    setSelectedWalletIds(draftWalletIds);
    setOpen(false);
  };

  const clearFilter = () => {
    setSelectedWalletIds([]);
    setDraftWalletIds([]);
    setOpen(false);
  };

  return {
    open,
    selectedWalletIds,
    draftWalletIds,
    openFilter,
    toggleWallet,
    applyFilter,
    clearFilter,
    closeFilter: () => setOpen(false),
    setSelectedWalletIds,
  };
}
