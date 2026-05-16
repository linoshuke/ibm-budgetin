"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useUIStore } from "@/stores/uiStore";
import { useWallets } from "@/hooks/useWallets";
import { walletCategories } from "@/utils/sample-data";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  category: z.string().min(1, "Kategori wajib dipilih"),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AddWalletDialog() {
  const open = useUIStore((state) => state.modals.addWallet);
  const closeModal = useUIStore((state) => state.closeModal);
  const pushToast = useUIStore((state) => state.pushToast);
  const { createWallet } = useWallets();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await createWallet({
        name: values.name,
        category: values.category,
        location: values.location ?? "",
      });
      pushToast({ title: "Dompet ditambahkan", variant: "success" });
      reset();
      closeModal("addWallet");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      pushToast({ title: "Gagal menambah dompet", description: message, variant: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => closeModal("addWallet")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Dompet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Nama Dompet</label>
            <Input placeholder="Contoh: Dompet Utama" {...register("name")} />
            {errors.name ? (
              <p className="mt-1 text-xs text-rose-300">{errors.name.message}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Kategori</label>
            <Select defaultValue="" {...register("category")}
            >
              <option value="" disabled>
                Pilih kategori
              </option>
              {walletCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
            {errors.category ? (
              <p className="mt-1 text-xs text-rose-300">{errors.category.message}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Lokasi (opsional)</label>
            <Input placeholder="Misal: BCA" {...register("location")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => closeModal("addWallet")}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
