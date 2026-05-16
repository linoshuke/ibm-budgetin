"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/uiStore";

export default function PasswordResetDialog() {
  const open = useUIStore((state) => state.modals.passwordReset);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const pushToast = useUIStore((state) => state.pushToast);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      pushToast({ title: "Gagal kirim reset", description: error.message, variant: "error" });
      return;
    }
    pushToast({ title: "Email reset terkirim", description: "Cek inbox Anda." });
    closeModal("passwordReset");
  };

  return (
    <>
      <button
        onClick={() => openModal("passwordReset")}
        className="text-[var(--accent-indigo)]"
      >
        Lupa Password?
      </button>
      <Dialog open={open} onOpenChange={() => closeModal("passwordReset")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Masukkan email akun Anda untuk menerima link reset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="email@contoh.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => closeModal("passwordReset")}>
                Batal
              </Button>
              <Button onClick={submit} disabled={loading}>
                {loading ? "Mengirim..." : "Kirim"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
