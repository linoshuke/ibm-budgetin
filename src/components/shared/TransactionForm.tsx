"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getIsoDateToday } from "@/lib/utils";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import { useAppSettingsStore } from "@/stores/appSettingsStore";
import type { Category } from "@/types/category";
import type { Transaction, TransactionType } from "@/types/transaction";
import type { Wallet } from "@/types/wallet";
import { useMemo, useState } from "react";

interface TransactionFormProps {
  categories: Category[];
  wallets: Wallet[];
  initialValue?: Transaction;
  onSubmit: (payload: Omit<Transaction, "id">) => void;
  onCreateWallet?: (payload: Omit<Wallet, "id" | "isDefault">) => Promise<Wallet>;
  onCancel?: () => void;
  submitLabel?: string;
  disabled?: boolean;
}

export default function TransactionForm({
  categories,
  wallets,
  initialValue,
  onSubmit,
  onCreateWallet,
  onCancel,
  submitLabel = "Simpan Transaksi",
  disabled = false,
}: TransactionFormProps) {
  const defaultType = useAppSettingsStore((state) => state.defaultTransactionType);
  const defaultWalletId = useAppSettingsStore((state) => state.defaultWalletId);
  const defaultCategoryId = useAppSettingsStore((state) => state.defaultCategoryId);

  const [type, setType] = useState<TransactionType>(initialValue?.type ?? defaultType ?? "expense");
  const [amountInput, setAmountInput] = useState(initialValue ? String(initialValue.amount) : "");
  const [categoryId, setCategoryId] = useState(initialValue?.categoryId ?? defaultCategoryId ?? "");
  const [walletId, setWalletId] = useState(initialValue?.walletId ?? defaultWalletId ?? "");
  const [date, setDate] = useState(initialValue?.date ?? getIsoDateToday());
  const [note, setNote] = useState(initialValue?.note ?? "");
  const [isBill, setIsBill] = useState(initialValue?.isBill ?? false);
  const [newWalletName, setNewWalletName] = useState("");
  const [showWalletInput, setShowWalletInput] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [savingWallet, setSavingWallet] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((item) => item.type === "both" || item.type === type),
    [categories, type],
  );

  const selectedCategoryId = filteredCategories.some((item) => item.id === categoryId)
    ? categoryId
    : (filteredCategories[0]?.id ?? "");

  const selectedWalletId = wallets.some((item) => item.id === walletId)
    ? walletId
    : (wallets[0]?.id ?? "");

  const amount = Number(amountInput || "0");

  const handleAddWallet = async () => {
    if (!onCreateWallet || disabled) return;

    const name = newWalletName.trim();
    if (!name) {
      setWalletError("Nama dompet wajib diisi.");
      return;
    }

    try {
      setSavingWallet(true);
      setWalletError("");
      const created = await onCreateWallet({ name, category: "Umum", location: "Lokal" });
      setWalletId(created.id);
      setNewWalletName("");
      setShowWalletInput(false);
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Gagal menambahkan dompet.");
    } finally {
      setSavingWallet(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    if (!selectedCategoryId || !selectedWalletId || amount <= 0) return;

    onSubmit({
      type,
      amount,
      categoryId: selectedCategoryId,
      walletId: selectedWalletId,
      date,
      note: note.trim(),
      isBill,
    });

    if (!initialValue) {
      setAmountInput("");
      setNote("");
      setDate(getIsoDateToday());
    }
  };

  return (
    <form id="transaction-form" className="glass-panel space-y-4 p-4" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={type === "income" ? "primary" : "outline"}
          onClick={() => setType("income")}
          disabled={disabled}
        >
          Pemasukan
        </Button>
        <Button
          type="button"
          variant={type === "expense" ? "primary" : "outline"}
          onClick={() => setType("expense")}
          disabled={disabled}
        >
          Pengeluaran
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-[var(--text-dimmed)]">Nominal</label>
          <Input
            inputMode="numeric"
            placeholder="Contoh: 150000"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value.replace(/\D/g, ""))}
            required
            disabled={disabled}
          />
          <div className="text-xs text-[var(--text-dimmed)]">
            Preview:{" "}
            <SensitiveCurrency value={amount} className="text-[var(--text-dimmed)]" eyeClassName="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[var(--text-dimmed)]">Kategori</label>
          <select
            value={selectedCategoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
            required
            disabled={disabled}
          >
            {filteredCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[var(--text-dimmed)]">Dompet</label>
          <div className="flex items-center gap-2">
            <select
              value={selectedWalletId}
              onChange={(event) => setWalletId(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
              required
              disabled={disabled}
            >
              {wallets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setWalletError("");
                setShowWalletInput((value) => !value);
              }}
              disabled={!onCreateWallet || disabled}
            >
              Tambah
            </Button>
          </div>
          {wallets.length === 0 ? (
            disabled ? (
              <p className="text-xs text-[var(--text-dimmed)]">Memuat dompet...</p>
            ) : (
              <p className="text-xs text-rose-400">Belum ada dompet. Tambahkan dompet terlebih dahulu.</p>
            )
          ) : null}
          {showWalletInput ? (
            <div className="space-y-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] p-2">
              <Input
                placeholder="Contoh: GoPay"
                value={newWalletName}
                onChange={(event) => setNewWalletName(event.target.value)}
                disabled={disabled}
              />
              <div className="flex items-center gap-2">
                <Button type="button" onClick={handleAddWallet} disabled={savingWallet || disabled}>
                  {savingWallet ? "Menyimpan..." : "Simpan Dompet"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowWalletInput(false);
                    setWalletError("");
                  }}
                  disabled={disabled}
                >
                  Batal
                </Button>
              </div>
              {walletError ? <p className="text-xs text-rose-400">{walletError}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[var(--text-dimmed)]">Tanggal</label>
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
            disabled={disabled}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm text-[var(--text-dimmed)]">Catatan (opsional)</label>
          <Input
            placeholder="Contoh: Mie Gacoan dan es teh"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={disabled}
          />
        </div>

        {type === "expense" && (
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="is-bill-checkbox"
              type="checkbox"
              checked={isBill}
              onChange={(e) => setIsBill(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-soft)] bg-[var(--bg-card-muted)] text-[var(--primary)] focus:ring-[var(--primary)]"
              disabled={disabled}
            />
            <label htmlFor="is-bill-checkbox" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer select-none">
              Tandai sebagai Tagihan Mendesak
            </label>
            <p className="text-[10px] text-[var(--text-dimmed)] ml-1">
              (Akan muncul di bagian Tagihan Mendesak pada Beranda)
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={disabled}>{submitLabel}</Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>
            Batal
          </Button>
        ) : null}
      </div>
    </form>
  );
}
