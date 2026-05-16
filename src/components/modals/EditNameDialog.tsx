"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useUIStore } from "@/stores/uiStore";

export default function EditNameDialog({ onSave }: { onSave: (value: string) => void }) {
  const open = useUIStore((state) => state.modals.editName);
  const closeModal = useUIStore((state) => state.closeModal);
  const [value, setValue] = useState("");

  const handleSave = () => {
    if (!value.trim()) return;
    onSave(value.trim());
    closeModal("editName");
  };

  return (
    <Dialog open={open} onOpenChange={() => closeModal("editName")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Nama</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Nama baru" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => closeModal("editName")}>
              Batal
            </Button>
            <Button onClick={handleSave}>Simpan</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
