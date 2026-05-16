"use client";

import Header from "@/components/layout/Header";
import MobileAppBar from "@/app/_components/mobile/MobileAppBar";
import MobileBottomNav from "@/app/_components/mobile/MobileBottomNav";
import AuthGate from "@/components/shared/AuthGate";
import Modal from "@/components/shared/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import type { Wallet } from "@/types/wallet";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function WalletsPage() {
  const wallets = useBudgetStore((state) => state.wallets);
  const transactions = useBudgetStore((state) => state.transactions);
  const loading = useBudgetStore((state) => state.loading);
  const [renameTarget, setRenameTarget] = useState<Wallet | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Wallet | null>(null);
  const [deleteValue, setDeleteValue] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // State untuk modal Tambah Dompet
  const [showAddModal, setShowAddModal] = useState(false);
  const [addWalletName, setAddWalletName] = useState("");
  const [addWalletCategory, setAddWalletCategory] = useState("Umum");
  const [addWalletLocation, setAddWalletLocation] = useState("Lokal");
  const [addWalletError, setAddWalletError] = useState("");
  const [addWalletLoading, setAddWalletLoading] = useState(false);

  const walletBalances = useMemo(() => {
    const map = new Map<string, number>();
    wallets.forEach((wallet) => map.set(wallet.id, 0));

    transactions.forEach((transaction) => {
      if (!map.has(transaction.walletId)) return;
      const delta = transaction.type === "income" ? transaction.amount : -transaction.amount;
      map.set(transaction.walletId, (map.get(transaction.walletId) ?? 0) + delta);
    });

    return map;
  }, [wallets, transactions]);

  useEffect(() => {
    if (renameTarget) {
      setRenameValue(renameTarget.name);
      setRenameError("");
    }
  }, [renameTarget]);

  useEffect(() => {
    if (deleteTarget) {
      setDeleteValue("");
      setDeleteError("");
    }
  }, [deleteTarget]);

  useEffect(() => {
    if (showAddModal) {
      setAddWalletName("");
      setAddWalletCategory("Umum");
      setAddWalletLocation("Lokal");
      setAddWalletError("");
    }
  }, [showAddModal]);

  const handleRename = async () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) {
      setRenameError("Nama dompet wajib diisi.");
      return;
    }

    try {
      setRenameLoading(true);
      setRenameError("");
      await budgetActions.updateWallet(renameTarget.id, { name });
      setRenameTarget(null);
    } catch (error) {
      setRenameError(error instanceof Error ? error.message : "Gagal mengganti nama dompet.");
    } finally {
      setRenameLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.isDefault) {
      setDeleteError("Dompet default tidak dapat dihapus.");
      return;
    }

    const name = deleteValue.trim();
    if (name !== deleteTarget.name) {
      setDeleteError("Nama dompet belum sesuai.");
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError("");
      await budgetActions.deleteWallet(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Gagal menghapus dompet.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddWallet = async () => {
    const name = addWalletName.trim();
    if (!name) {
      setAddWalletError("Nama dompet wajib diisi.");
      return;
    }

    try {
      setAddWalletLoading(true);
      setAddWalletError("");
      await budgetActions.addWallet({
        name,
        category: addWalletCategory,
        location: addWalletLocation,
      });
      setShowAddModal(false);
    } catch (error) {
      setAddWalletError(error instanceof Error ? error.message : "Gagal menambahkan dompet.");
    } finally {
      setAddWalletLoading(false);
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen">
        <div className="hidden md:block">
          <Header />
        </div>
        <div className="md:hidden">
          <MobileAppBar title="Dompet" />
        </div>

        <main className="page-shell space-y-6">
          <section className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Wallet</h1>
              <p className="text-sm text-[var(--text-dimmed)]">
                Lihat saldo tiap dompet dan kelola nama dompet Anda.
              </p>
            </div>
            <Button
              id="btn-tambah-dompet"
              onClick={() => setShowAddModal(true)}
              disabled={loading}
            >
              + Tambah Dompet
            </Button>
          </section>

          {wallets.length === 0 ? (
            <section className="glass-panel p-4 text-sm text-[var(--text-dimmed)]">
              Belum ada dompet. Klik tombol &quot;+ Tambah Dompet&quot; untuk membuat dompet baru.
            </section>
          ) : (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {wallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  balance={walletBalances.get(wallet.id) ?? 0}
                  disabled={loading}
                  onRename={() => setRenameTarget(wallet)}
                  onDelete={() => setDeleteTarget(wallet)}
                />
              ))}
            </section>
          )}
        </main>

        {/* Modal Tambah Dompet */}
        <Modal
          open={showAddModal}
          title="Tambah Dompet Baru"
          onClose={() => setShowAddModal(false)}
          sizeClassName="max-w-xl"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-[var(--text-dimmed)]">Nama Dompet</label>
              <Input
                id="input-nama-dompet"
                placeholder="Contoh: BCA, OVO, Tunai..."
                value={addWalletName}
                onChange={(event) => setAddWalletName(event.target.value)}
                disabled={loading || addWalletLoading}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleAddWallet();
                }}
              />
              {addWalletError ? <p className="text-xs text-rose-400">{addWalletError}</p> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-[var(--text-dimmed)]">
                Kategori
                <select
                  className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  value={addWalletCategory}
                  onChange={(event) => setAddWalletCategory(event.target.value)}
                >
                  <option>Umum</option>
                  <option>Bank</option>
                  <option>e-Wallet</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-[var(--text-dimmed)]">
                Lokasi
                <select
                  className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  value={addWalletLocation}
                  onChange={(event) => setAddWalletLocation(event.target.value)}
                >
                  <option>Lokal</option>
                  <option>Internasional</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                id="btn-simpan-dompet"
                onClick={handleAddWallet}
                disabled={loading || addWalletLoading}
              >
                {addWalletLoading ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                disabled={loading || addWalletLoading}
              >
                Batal
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={Boolean(renameTarget)}
          title="Ganti Nama Dompet"
          onClose={() => setRenameTarget(null)}
          sizeClassName="max-w-xl"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-[var(--text-dimmed)]">Nama Dompet</label>
              <Input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                disabled={loading || renameLoading}
              />
              {renameError ? <p className="text-xs text-rose-400">{renameError}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleRename} disabled={loading || renameLoading}>
                {renameLoading ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button variant="outline" onClick={() => setRenameTarget(null)} disabled={loading || renameLoading}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={Boolean(deleteTarget)}
          title="Hapus Dompet"
          onClose={() => setDeleteTarget(null)}
          sizeClassName="max-w-xl"
        >
          <div className="space-y-4 text-sm text-[var(--text-dimmed)]">
            <p>
              Langkah 1: Pastikan dompet yang dipilih sudah benar. Penghapusan bersifat permanen.
            </p>
            <p>
              Langkah 2: Ketik nama dompet <span className="font-semibold text-[var(--text-primary)]">{deleteTarget?.name}</span> untuk melanjutkan.
            </p>
            <div className="space-y-2">
              <Input
                placeholder="Tulis nama dompet"
                value={deleteValue}
                onChange={(event) => setDeleteValue(event.target.value)}
                disabled={loading || deleteLoading}
              />
              {deleteError ? <p className="text-xs text-rose-400">{deleteError}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={
                  loading ||
                  deleteLoading ||
                  !deleteTarget ||
                  deleteTarget.isDefault ||
                  deleteValue.trim() !== deleteTarget.name
                }
              >
                {deleteLoading ? "Menghapus..." : "Hapus Permanen"}
              </Button>
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={loading || deleteLoading}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>

        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      </div>
    </AuthGate>
  );
}

function WalletCard({
  wallet,
  balance,
  onRename,
  onDelete,
  disabled,
}: {
  wallet: Wallet;
  balance: number;
  onRename: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="glass-panel flex items-start justify-between gap-4 p-4 transition-colors hover:border-[var(--border-strong)]">
      <Link
        href={`/wallets/${wallet.id}` as Route}
        className="flex-1 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{wallet.name}</h2>
          {wallet.isDefault ? (
            <span className="rounded-full border border-teal-500/40 bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-teal-300">
              Default
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-[var(--text-dimmed)]">Total saldo</p>
        <p className="text-base font-semibold text-[var(--text-primary)]">
          <SensitiveCurrency value={balance} eyeClassName="h-6 w-6" />
        </p>
      </Link>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="rounded-lg border border-[var(--border-soft)] px-2 py-1 text-lg text-[var(--text-dimmed)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          onClick={() => setMenuOpen((value) => !value)}
          disabled={disabled}
        >
          :
        </button>
        {menuOpen ? (
          <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-2 text-sm shadow-xl">
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
              onClick={() => {
                setMenuOpen(false);
                onRename();
              }}
            >
              Ganti nama dompet
            </button>
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              disabled={wallet.isDefault}
            >
              Hapus dompet
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
