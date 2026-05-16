"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useUIStore } from "@/stores/uiStore";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";

const schema = z.object({
  description: z.string().min(1, "Deskripsi wajib diisi"),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
});

type FormValues = z.infer<typeof schema>;

interface AddTransactionDialogProps {
  walletId: string;
}

export default function AddTransactionDialog({ walletId }: AddTransactionDialogProps) {
  const open = useUIStore((state) => state.modals.addTransaction);
  const closeModal = useUIStore((state) => state.closeModal);
  const pushToast = useUIStore((state) => state.pushToast);
  const categories = useBudgetStore((state) => state.categories);
  const loading = useBudgetStore((state) => state.loading);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "expense", categoryId: "" },
  });

  const typeValue = watch("type");
  const categoryValue = watch("categoryId");
  const categoryRegister = register("categoryId");

  const filteredCategories = useMemo(
    () => categories.filter((item) => item.type === "both" || item.type === typeValue),
    [categories, typeValue],
  );

  useEffect(() => {
    if (!filteredCategories.length) return;
    const exists = filteredCategories.some((item) => item.id === categoryValue);
    if (!exists) {
      setValue("categoryId", filteredCategories[0].id);
    }
  }, [categoryValue, filteredCategories, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      const date = new Date();
      await budgetActions.addTransaction({
        walletId,
        categoryId: values.categoryId,
        type: values.type,
        amount: values.amount,
        note: values.description,
        date: date.toISOString().slice(0, 10),
      });

      pushToast({ title: "Transaksi tersimpan", variant: "success" });
      reset();
      closeModal("addTransaction");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      pushToast({ title: "Gagal menambah transaksi", description: message, variant: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => closeModal("addTransaction")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaksi Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Deskripsi</label>
            <Input placeholder="Contoh: Belanja groceries" {...register("description")} />
            {errors.description ? (
              <p className="mt-1 text-xs text-rose-300">{errors.description.message}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Nominal</label>
            <Input type="number" inputMode="numeric" {...register("amount")} />
            {errors.amount ? (
              <p className="mt-1 text-xs text-rose-300">{errors.amount.message}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={typeValue === "expense" ? "primary" : "outline"}
              onClick={() => setValue("type", "expense")}
              className="flex-1"
            >
              Pengeluaran
            </Button>
            <Button
              type="button"
              variant={typeValue === "income" ? "primary" : "outline"}
              onClick={() => setValue("type", "income")}
              className="flex-1"
            >
              Pemasukan
            </Button>
          </div>
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Kategori</label>
            <select
              {...categoryRegister}
              value={categoryValue}
              onChange={(event) => {
                categoryRegister.onChange(event);
                setValue("categoryId", event.target.value);
              }}
              className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
              disabled={isSubmitting || loading || filteredCategories.length === 0}
              required
            >
              {filteredCategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {filteredCategories.length === 0 ? (
              <p className="mt-1 text-xs text-rose-300">Belum ada kategori untuk tipe ini.</p>
            ) : null}
            {errors.categoryId ? (
              <p className="mt-1 text-xs text-rose-300">{errors.categoryId.message}</p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => closeModal("addTransaction")}>
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
