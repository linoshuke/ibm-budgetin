"use client";

import { useMemo, useState } from "react";
import LockWidget from "@/components/LockWidget";
import { useAuth } from "@/hooks/useAuth";
import { useNonceStyle } from "@/hooks/useNonceStyle";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import type { CategoryType } from "@/types/category";

function CategoryBadge({ color, icon }: { color: string; icon: string }) {
  const badgeClass = useNonceStyle(`background-color: ${color};`);
  return (
    <span
      className={`inline-flex min-w-10 justify-center rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white ${badgeClass}`}
    >
      {icon}
    </span>
  );
}

export default function CategoriesPage() {
  const { isAnonymous } = useAuth();
  const categories = useBudgetStore((state) => state.categories);
  const transactions = useBudgetStore((state) => state.transactions);
  const loading = useBudgetStore((state) => state.loading);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#13d2eb");
  const [type, setType] = useState<CategoryType>("expense");

  const usageCount = useMemo(() => {
    const counts = new Map<string, number>();
    transactions.forEach((item) => {
      counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
    });
    return counts;
  }, [transactions]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || loading) return;

    try {
      await budgetActions.addCategory({
        name: name.trim(),
        icon: icon.trim() || "NEW",
        color,
        type,
      });

      setName("");
      setIcon("");
      setColor("#13d2eb");
      setType("expense");
    } catch (error) {
      console.error("Gagal menambah kategori:", error);
    }
  };

  if (isAnonymous) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LockWidget message="Fitur kategori tersedia setelah Anda login." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface">Manajemen Kategori</h1>
        <p className="text-sm text-on-surface-variant">
          Kategori default sudah tersedia. Tambahkan kategori baru untuk kebutuhan pribadi.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-outline-variant/5 bg-surface-container-low p-6 lg:col-span-4">
          <h2 className="mb-4 font-headline text-lg font-bold text-on-surface">Tambah Kategori</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Nama Kategori
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Investasi"
                className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Kode Ikon
              </label>
              <input
                value={icon}
                onChange={(event) => setIcon(event.target.value.toUpperCase().slice(0, 5))}
                placeholder="Contoh: FUND"
                className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Tipe Kategori
              </label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as CategoryType)}
                className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
                disabled={loading}
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
                <option value="both">Keduanya</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Warna
              </label>
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-12 w-full rounded-lg border border-outline-variant/20 bg-surface-container"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Tambah Kategori"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-outline-variant/5 bg-surface-container-low p-6 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg font-bold text-on-surface">Daftar Kategori</h2>
            <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              {categories.length} Kategori
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <article
                key={category.id}
                className="rounded-xl border border-outline-variant/10 bg-surface-container p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CategoryBadge color={category.color} icon={category.icon} />
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{category.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {category.type === "income"
                          ? "Pemasukan"
                          : category.type === "expense"
                            ? "Pengeluaran"
                            : "Keduanya"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    {category.isDefault ? "Default" : "Custom"}
                  </span>
                </div>
                <p className="mt-3 text-xs text-on-surface-variant">
                  Dipakai di {usageCount.get(category.id) ?? 0} transaksi.
                </p>
              </article>
            ))}
            {categories.length === 0 ? (
              <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-4 text-sm text-on-surface-variant">
                Belum ada kategori. Tambahkan kategori pertama menggunakan form di samping.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
