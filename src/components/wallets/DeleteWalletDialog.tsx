"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useWallets } from "@/hooks/useWallets";
import { useUIStore } from "@/stores/uiStore";

interface DeleteWalletDialogProps {
  walletId: string;
  walletName: string;
}

export default function DeleteWalletDialog({ walletId, walletName }: DeleteWalletDialogProps) {
  const pushToast = useUIStore((state) => state.pushToast);
  const { deleteWallet } = useWallets();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== walletName) return;
    setLoading(true);
    try {
      await deleteWallet(walletId);
      pushToast({ title: "Dompet dihapus", variant: "success" });
      setOpen(false);
      setConfirmText("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      pushToast({ title: "Gagal menghapus dompet", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Hapus
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Dompet</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-dimmed)]">
            Ketik nama dompet <span className="font-semibold text-[var(--accent-indigo)]">{walletName}</span> untuk konfirmasi.
          </p>
          <Input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={loading || confirmText !== walletName}>
              {loading ? "Menghapus..." : "Hapus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
