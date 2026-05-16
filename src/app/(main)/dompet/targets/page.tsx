"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LockWidget from "@/components/LockWidget";
import { useAuth } from "@/hooks/useAuth";
import { useNonceStyle } from "@/hooks/useNonceStyle";
import { useBudgetStore } from "@/store/budgetStore";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import { getMonthLabel, toCsvRow } from "@/lib/utils";
import type { CategoryBudget } from "@/types";
import type { Category } from "@/types/category";

function CategoryBadge({ color, label }: { color: string; label: string }) {
  const badgeClass = useNonceStyle(`background-color: ${color};`);
  return (
    <span
      className={`inline-flex min-w-10 justify-center rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white ${badgeClass}`}
    >
      {label}
    </span>
  );
}

export default function BudgetTargetsHistoryPage() {
  const { user, isAnonymous, loading: authLoading } = useAuth();
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  const categoriesData = useBudgetStore((state) => state.categories) as Category[];
  const categoriesLoading = useBudgetStore((state) => state.loading);

  const { data: budgetsData = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ["category-budgets", user?.id ?? "anon", "history"],
    enabled: Boolean(user) && !isAnonymous,
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch("/api/category-budgets?history=1", { credentials: "include" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return (await response.json()) as CategoryBudget[];
    },
  });

  const categoryMap = useMemo(
    () => new Map(categoriesData.map((item) => [item.id, item])),
    [categoriesData],
  );

  const groupedBudgets = useMemo(() => {
    const map = new Map<string, CategoryBudget[]>();
    budgetsData.forEach((item) => {
      const list = map.get(item.month_key) ?? [];
      list.push(item);
      map.set(item.month_key, list);
    });
    return [...map.entries()].map(([monthKey, items]) => ({
      monthKey,
      items: items.sort((a, b) => (categoryMap.get(a.category_id)?.name ?? "").localeCompare(categoryMap.get(b.category_id)?.name ?? "")),
    }));
  }, [budgetsData, categoryMap]);

  const availableYears = useMemo(() => {
    const years = new Set(budgetsData.map((item) => item.month_key.split("-")[0]));
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [budgetsData]);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const value = String(index + 1).padStart(2, "0");
        const label = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(2020, index, 1));
        return { value, label };
      }),
    [],
  );

  const filteredGroups = useMemo(() => {
    return groupedBudgets.filter((group) => {
      const [year, month] = group.monthKey.split("-");
      if (yearFilter !== "all" && year !== yearFilter) return false;
      if (monthFilter !== "all" && month !== monthFilter) return false;
      return true;
    });
  }, [groupedBudgets, monthFilter, yearFilter]);

  const exportCsv = () => {
    const header = ["Bulan", "Kategori", "Target"];
    const rows = filteredGroups.flatMap((group) =>
      group.items.map((item) => [
        getMonthLabel(group.monthKey),
        categoryMap.get(item.category_id)?.name ?? "Kategori",
        Number(item.target_amount),
      ]),
    );

    const csv = [toCsvRow(header), ...rows.map((row) => toCsvRow(row))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `budgetin-budgets-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!user || isAnonymous) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LockWidget message="Histori target tersedia setelah Anda login." />
      </div>
    );
  }

  const loading = categoriesLoading || budgetsLoading;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Histori Target Anggaran</h1>
          <p className="text-sm text-on-surface-variant">Ringkasan target pengeluaran per kategori.</p>
        </div>
        <Link
          href="/dompet"
          className="rounded-lg border border-outline-variant/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
        >
          Kembali ke Budgets
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 text-sm text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Filter</span>
          <select
            value={yearFilter}
            onChange={(event) => setYearFilter(event.target.value)}
            className="rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface"
          >
            <option value="all">Semua tahun</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            className="rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface"
          >
            <option value="all">Semua bulan</option>
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filteredGroups.length === 0}
          className="rounded-lg border border-primary/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 disabled:opacity-60"
        >
          Ekspor CSV
        </button>
        {(yearFilter !== "all" || monthFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setYearFilter("all");
              setMonthFilter("all");
            }}
            className="rounded-lg border border-outline-variant/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
          >
            Reset filter
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-6 text-sm text-on-surface-variant">
          Memuat histori target...
        </div>
      ) : groupedBudgets.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 text-sm text-on-surface-variant">
          <p className="text-base font-semibold text-on-surface">Belum ada histori target.</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Set target budget bulanan agar histori tersimpan otomatis.
          </p>
          <Link
            href="/dompet"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary"
          > 
            Atur Target
          </Link>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 text-sm text-on-surface-variant">
          <p className="text-base font-semibold text-on-surface">Tidak ada data untuk filter ini.</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Coba ubah pilihan bulan atau tahun untuk melihat histori lain.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredGroups.map((group) => (
            <section key={group.monthKey} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-headline text-lg font-bold text-on-surface">{getMonthLabel(group.monthKey)}</h2>
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  {group.items.length} kategori
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => {
                  const category = categoryMap.get(item.category_id);
                  return (
                    <article
                      key={item.id}
                      className="rounded-xl border border-outline-variant/10 bg-surface-container p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CategoryBadge
                            color={category?.color ?? "#64748b"}
                            label={(category?.name ?? "Kategori").slice(0, 3).toUpperCase()}
                          />
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{category?.name ?? "Kategori"}</p>
                            <p className="text-xs text-on-surface-variant">Target bulan ini</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-primary">
                          <SensitiveCurrency
                            value={Number(item.target_amount)}
                            className="text-primary"
                            eyeClassName="h-6 w-6 border-transparent bg-transparent hover:bg-surface-container"
                            wrapperClassName="gap-1"
                          />
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
