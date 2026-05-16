"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import PageIndicator from "@/components/statistics/PageIndicator";
import LockWidget from "@/components/LockWidget";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import ChartDeferred from "@/components/shared/ChartDeferred";
import StatCard from "@/components/shared/StatCard";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import TransactionList from "@/components/history/TransactionList";
import { useWallets } from "@/hooks/useWallets";
import { useAuth } from "@/hooks/useAuth";
import { useBudgetStore } from "@/store/budgetStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { getMonthLabel, getMonthRange } from "@/utils/date";
import type { Transaction } from "@/types";
import type { Category } from "@/types/category";

const WalletStatCard = dynamic(() => import("@/components/statistics/WalletStatCard"), {
  ssr: false,
  loading: () => <div className="h-[260px] rounded-2xl bg-surface-container-low/50" />,
});

function clampPercent(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return Math.min(Math.max(Math.round(safe), 0), 100);
}

function HeightBar({ percent, className }: { percent: number; className: string }) {
  const clamped = clampPercent(percent);
  return (
    <div className="h-full w-full overflow-hidden rounded-t-md bg-surface-container-highest/20 flex items-end">
      <div
        className={`min-h-[12px] w-full rounded-t-md transition-all duration-500 ${className}`}
        style={{ height: `${clamped}%` }}
      />
    </div>
  );
}

function ProgressBar({ percent, className }: { percent: number; className: string }) {
  const clamped = clampPercent(percent);
  return (
    <div 
      className={`h-full rounded-full transition-all duration-500 ${className}`} 
      style={{ width: `${clamped}%` }}
    />
  );
}

function formatISODate(dateValue: Date) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateValue: Date, delta: number) {
  const copy = new Date(dateValue);
  copy.setDate(copy.getDate() + delta);
  return copy;
}

function buildChartData(transactions: Transaction[]) {
  const totals: Record<
    string,
    { income: number; expense: number; items: Array<{ description: string; amount: number; type: string }> }
  > = {};

  transactions.forEach((trx) => {
    const day = new Date(trx.date).getDate().toString();
    if (!totals[day]) totals[day] = { income: 0, expense: 0, items: [] };
    if (trx.type === "income") totals[day].income += trx.amount;
    if (trx.type === "expense") totals[day].expense += trx.amount;
    totals[day].items.push({
      description: trx.description,
      amount: trx.amount,
      type: trx.type,
    });
  });

  return Object.entries(totals)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([day, value]) => ({ day, income: value.income, expense: -value.expense, items: value.items }));
}

function isAfterCurrentMonth(year: number, month: number) {
  const now = new Date();
  const selected = new Date(year, month - 1, 1);
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  return selected.getTime() > current.getTime();
}

function isCurrentMonth(year: number, month: number) {
  const now = new Date();
  return year === now.getFullYear() && month === now.getMonth() + 1;
}

export default function ReportsClient() {
  const { selectedWallets } = useWallets();
  const { user, isAnonymous, loading: authLoading } = useAuth();
  const { currentMonth, prevMonth, nextMonth } = useTransactionStore();
  const categories = useBudgetStore((state) => state.categories) as Category[];

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);

  const monthLabel = useMemo(
    () => getMonthLabel(currentMonth.year, currentMonth.month),
    [currentMonth.month, currentMonth.year],
  );

  const nextDisabled = useMemo(
    () => isAfterCurrentMonth(currentMonth.year, currentMonth.month) || isCurrentMonth(currentMonth.year, currentMonth.month),
    [currentMonth.month, currentMonth.year],
  );

  const { data, isLoading: queryLoading, isError, refetch } = useQuery({
    queryKey: ["transactions", "reports", user?.id ?? "anon", currentMonth.year, currentMonth.month],
    enabled: Boolean(user) && !isAnonymous,
    queryFn: async () => {
      if (!user) return [];
      const { start, end } = getMonthRange(currentMonth.year, currentMonth.month);
      const params = new URLSearchParams({
        limit: "500",
        offset: "0",
        dateFrom: start,
        dateTo: end,
      });
      const response = await fetch(`/api/transactions?${params.toString()}`, { 
        credentials: "include", 
      }); 
      if (!response.ok) { 
        throw new Error(`HTTP ${response.status}`); 
      } 
      const payload = (await response.json()) as {
        items: Array<{
          id: string;
          amount: number;
          type: Transaction["type"];
          date: string;
          walletId?: string | null;
          categoryId?: string | null;
          note?: string | null;
        }>;
      };
      return (payload.items ?? []).map((item) => ({
        id: item.id,
        wallet_id: item.walletId ?? "",
        user_id: user.id,
        description: item.note ?? "",
        amount: Number(item.amount ?? 0),
        type: item.type,
        date: item.date,
        created_at: item.date,
        category_id: item.categoryId ?? null,
      })) as Transaction[];
    },
  });

  const grouped = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    (data ?? []).forEach((trx) => {
      map[trx.wallet_id] = map[trx.wallet_id] ?? [];
      map[trx.wallet_id].push(trx);
    });
    return map;
  }, [data]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    (data ?? []).forEach((trx) => {
      if (trx.type === "income") income += Number(trx.amount ?? 0);
      if (trx.type === "expense") expense += Number(trx.amount ?? 0);
    });
    return {
      income,
      expense,
      net: income - expense,
      count: (data ?? []).length,
    };
  }, [data]);

  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);

  const walletStats = useMemo(() => {
    return selectedWallets.map((wallet) => {
      const transactions = grouped[wallet.id] ?? [];
      let income = 0;
      let expense = 0;
      transactions.forEach((trx) => {
        if (trx.type === "income") income += trx.amount;
        if (trx.type === "expense") expense += trx.amount;
      });
      return {
        id: wallet.id,
        name: wallet.name,
        income,
        expense,
        count: transactions.length,
        chart: buildChartData(transactions),
      };
    });
  }, [grouped, selectedWallets]);

  const activeWallet = walletStats.find((wallet) => wallet.id === activeWalletId) ?? walletStats[0];
  const showTabs = walletStats.length > 2;

  const categoryBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        icon: string;
        total: number;
        count: number;
      }
    >();

    (data ?? []).forEach((trx) => {
      if (trx.type !== "expense") return;
      const id = trx.category_id ?? "";
      if (!id) return;
      const category = categoryMap.get(id);
      if (!category) return;

      const entry = map.get(id) ?? {
        id,
        name: category.name,
        icon: category.icon || "category",
        total: 0,
        count: 0,
      };

      entry.total += Number(trx.amount ?? 0);
      entry.count += 1;
      map.set(id, entry);
    });

    const totalExpense = totals.expense > 0 ? totals.expense : 1;

    return [...map.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 4)
      .map((item) => ({
        ...item,
        percent: Math.round((item.total / totalExpense) * 100),
      }));
  }, [categoryMap, data, totals.expense]);

  const spendingTrendWeek = useMemo(() => {
    const now = new Date();
    const isCurrent = currentMonth.year === now.getFullYear() && currentMonth.month === now.getMonth() + 1;
    const end = isCurrent
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : new Date(currentMonth.year, currentMonth.month, 0);

    const expenseByDate = new Map<string, { total: number; items: Array<{ description: string; amount: number; type: string }> }>();
    (data ?? []).forEach((trx) => {
      if (trx.type !== "expense") return;
      const key = trx.date.slice(0, 10);
      const entry = expenseByDate.get(key) ?? { total: 0, items: [] };
      entry.total += Number(trx.amount ?? 0);
      entry.items.push({
        description: trx.description,
        amount: Number(trx.amount ?? 0),
        type: trx.type,
      });
      expenseByDate.set(key, entry);
    });

    const currentDates = Array.from({ length: 7 }, (_, index) => addDays(end, index - 6));
    const prevEnd = addDays(end, -7);
    const prevDates = Array.from({ length: 7 }, (_, index) => addDays(prevEnd, index - 6));

    const currentEntries = currentDates.map((dateValue) => expenseByDate.get(formatISODate(dateValue)) ?? { total: 0, items: [] });
    const prevEntries = prevDates.map((dateValue) => expenseByDate.get(formatISODate(dateValue)) ?? { total: 0, items: [] });

    const total = currentEntries.reduce((acc, entry) => acc + entry.total, 0);
    const prevTotal = prevEntries.reduce((acc, entry) => acc + entry.total, 0);
    const max = Math.max(...currentEntries.map(e => e.total), 1);
    const maxIndex = currentEntries.reduce((best, entry, index) => (entry.total > currentEntries[best].total ? index : best), 0);

    const change =
      prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : total > 0 ? 100 : 0;

    const formatter = new Intl.DateTimeFormat("id-ID", { weekday: "short" });
    const tooltipFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "2-digit", month: "short" });

    return {
      total,
      change,
      max,
      maxIndex,
      bars: currentDates.map((dateValue, index) => ({
        label: formatter.format(dateValue).toUpperCase(),
        tooltip: tooltipFormatter.format(dateValue),
        value: currentEntries[index].total,
        percent: (currentEntries[index].total / max) * 100,
        items: currentEntries[index].items,
      })),
    };
  }, [currentMonth.month, currentMonth.year, data]);

  const topExpenseWallets = useMemo(() => {
    return [...walletStats]
      .filter((wallet) => wallet.count > 0)
      .sort((a, b) => b.expense - a.expense)
      .slice(0, 3);
  }, [walletStats]);

  if (authLoading) {
    return (
      <div className="space-y-10 animate-fade-in">
        <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-48 rounded-xl" />
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </section>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (!user || isAnonymous) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LockWidget message="Laporan lengkap tersedia setelah Anda login." />
      </div>
    );
  }

  if (!selectedWallets.length) {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
        Belum ada dompet untuk ditampilkan pada laporan.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight">Laporan & Analitik</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Ringkasan pemasukan & pengeluaran untuk <span className="font-semibold text-on-surface">{monthLabel}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-surface-container-low p-1.5">
          <Button
            type="button"
            variant="ghost"
            onClick={prevMonth}
            icon={<span className="material-symbols-outlined text-lg">chevron_left</span>}
            aria-label="Bulan sebelumnya"
            title="Bulan sebelumnya"
          />
          <div className="px-3 py-2 text-sm font-bold text-primary">{monthLabel}</div>
          <Button
            type="button"
            variant="ghost"
            onClick={nextMonth}
            disabled={nextDisabled}
            icon={<span className="material-symbols-outlined text-lg">chevron_right</span>}
            aria-label="Bulan berikutnya"
            title={nextDisabled ? "Tidak ada data bulan berikutnya" : "Bulan berikutnya"}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Pemasukan"
          value={<SensitiveCurrency value={totals.income} />}
          helper={`${totals.count} transaksi`}
          accent="emerald"
        />
        <StatCard
          title="Total Pengeluaran"
          value={<SensitiveCurrency value={totals.expense} />}
          helper="Pengeluaran bulan berjalan"
          accent="rose"
        />
        <StatCard
          title="Saldo Bersih"
          value={<SensitiveCurrency value={totals.net} />}
          helper="Pemasukan dikurangi pengeluaran"
          accent="teal"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-xl bg-surface-container-low p-8 overflow-hidden relative">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-headline text-lg font-bold">Spending Trends</h3>
              <p className="text-sm text-on-surface-variant">Total outflow 7 hari terakhir</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tabular-nums text-primary">
                <SensitiveCurrency value={spendingTrendWeek.total} showEye={false} />
              </div>
              <div className="text-xs text-primary flex items-center justify-end">
                <span className="material-symbols-outlined text-sm mr-1" data-icon="trending_down">
                  {spendingTrendWeek.change > 0 ? "trending_up" : "trending_down"}
                </span>
                {Math.abs(spendingTrendWeek.change).toFixed(0)}% vs 7 hari sebelumnya
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2">
            {spendingTrendWeek.bars.map((bar, index) => {
              const highlight = index === spendingTrendWeek.maxIndex && bar.value > 0;
              return (
                <div key={`${bar.label}-${index}`} className="relative group flex h-full flex-1 items-end">
                  <div className="absolute bottom-full left-1/2 z-50 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-max max-w-[200px] rounded-xl border border-outline-variant/20 bg-surface-container-highest p-3 text-[11px] shadow-2xl">
                      <p className="font-bold text-on-surface mb-2">{bar.tooltip}</p>
                      <div className="space-y-1.5">
                        {bar.items.length > 0 ? (
                          bar.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex justify-between gap-3">
                              <span className="truncate text-on-surface-variant">{item.description || "Tanpa catatan"}</span>
                              <span className="font-bold text-error whitespace-nowrap">
                                <SensitiveCurrency value={item.amount} showEye={false} />
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-on-surface-variant italic">Tidak ada pengeluaran</p>
                        )}
                        {bar.items.length > 3 && (
                          <p className="text-[9px] text-center pt-1 border-t border-outline-variant/30 text-on-surface-variant/70">
                            +{bar.items.length - 3} transaksi lainnya
                          </p>
                        )}
                      </div>
                      <div className="mt-2 pt-2 border-t border-outline-variant/30 flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-primary">
                          <SensitiveCurrency value={bar.value} showEye={false} />
                        </span>
                      </div>
                    </div>
                  </div>
                  <HeightBar
                    percent={bar.percent}
                    className={
                      highlight
                        ? "bg-primary group-hover:bg-primary/80 border-t-4 border-primary-container"
                        : "bg-primary/40 group-hover:bg-primary/60"
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between mt-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
            {spendingTrendWeek.bars.map((bar, index) => (
              <span key={`${bar.label}-label-${index}`}>{bar.label}</span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-headline text-base font-bold">Dompet Pengeluaran Terbesar</h3>
                <p className="text-xs text-on-surface-variant">Top 3 berdasarkan total pengeluaran</p>
              </div>
              <span className="material-symbols-outlined text-primary" aria-hidden="true">
                bar_chart
              </span>
            </div>
            {topExpenseWallets.length ? (
              <div className="space-y-3">
                {topExpenseWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => setActiveWalletId(wallet.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-outline-variant/10 bg-surface-container-highest/60 px-4 py-3 text-left transition-colors hover:bg-surface-container-highest"
                  >
                    <div>
                      <div className="text-sm font-semibold text-on-surface">{wallet.name}</div>
                      <div className="text-[11px] text-on-surface-variant">{wallet.count} transaksi</div>
                    </div>
                    <div className="text-sm font-bold text-error">
                      <SensitiveCurrency value={wallet.expense} showEye={false} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Belum ada pengeluaran pada periode ini.</p>
            )}
          </div>

          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-headline text-base font-bold">Dompet Aktif</h3>
                <p className="text-xs text-on-surface-variant">Klik untuk fokus ke chart dompet</p>
              </div>
              <span className="material-symbols-outlined text-secondary-container" aria-hidden="true">
                account_balance_wallet
              </span>
            </div>
            <div className="space-y-3">
              {walletStats
                .slice()
                .sort((a, b) => b.count - a.count)
                .slice(0, 4)
                .map((wallet) => (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => setActiveWalletId(wallet.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-outline-variant/10 bg-surface-container-highest/60 px-4 py-3 text-left transition-colors hover:bg-surface-container-highest"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-on-surface">{wallet.name}</div>
                      <div className="text-[11px] text-on-surface-variant">{wallet.count} transaksi</div>
                    </div>
                    <span
                      className={`ml-3 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ${
                        wallet.id === (activeWallet?.id ?? walletStats[0]?.id)
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-container-highest text-on-surface-variant"
                      }`}
                    >
                      {wallet.id === (activeWallet?.id ?? walletStats[0]?.id) ? "Aktif" : "Pilih"}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="font-headline text-lg font-bold">Per Dompet</h3>
            <p className="text-xs text-on-surface-variant">Bandingkan pemasukan & pengeluaran tiap dompet</p>
          </div>
          {showTabs ? (
            <div className="hidden flex-wrap gap-2 tablet:flex">
              {walletStats.map((wallet) => (
                <Button
                  key={wallet.id}
                  variant={wallet.id === (activeWallet?.id ?? walletStats[0]?.id) ? "primary" : "outline"}
                  onClick={() => setActiveWalletId(wallet.id)}
                >
                  {wallet.name}
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="tablet:hidden">
          <div
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
            onScroll={(event) => {
              const target = event.currentTarget;
              const index = Math.round(target.scrollLeft / target.clientWidth);
              setActiveIndex(index);
            }}
          >
            {walletStats.map((wallet) => (
              <div key={wallet.id} className="min-w-[85%] snap-center">
                <ChartDeferred
                  className="w-full"
                  fallback={<div className="h-[260px] rounded-2xl bg-surface-container-low/50" />}
                >
                  <WalletStatCard walletName={wallet.name} data={wallet.chart} />
                </ChartDeferred>
              </div>
            ))}
          </div>
          <PageIndicator count={walletStats.length} activeIndex={activeIndex} />
        </div>

        <div className="hidden tablet:block">
          {showTabs ? (
            <div className="space-y-4">
              {activeWallet ? (
                <ChartDeferred
                  className="w-full"
                  fallback={<div className="h-[260px] rounded-2xl bg-surface-container-low/50" />}
                >
                  <WalletStatCard walletName={activeWallet.name} data={activeWallet.chart} />
                </ChartDeferred>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-6 desktop:grid-cols-2">
              {walletStats.map((wallet) => (
                <ChartDeferred
                  key={wallet.id}
                  className="w-full"
                  fallback={<div className="h-[260px] rounded-2xl bg-surface-container-low/50" />}
                >
                  <WalletStatCard walletName={wallet.name} data={wallet.chart} />
                </ChartDeferred>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-headline text-lg font-bold">Breakdown Kategori</h3>
          <p className="text-xs text-on-surface-variant">Top kategori pengeluaran pada {monthLabel}</p>
        </div>

        {categoryBreakdown.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 desktop:grid-cols-4">
            {categoryBreakdown.map((item, index) => {
              const accent =
                index === 0
                  ? { iconWrap: "bg-primary/10", iconText: "text-primary", bar: "bg-primary" }
                  : index === 1
                    ? { iconWrap: "bg-tertiary/10", iconText: "text-tertiary", bar: "bg-tertiary" }
                    : index === 2
                      ? { iconWrap: "bg-secondary/10", iconText: "text-secondary", bar: "bg-secondary" }
                      : { iconWrap: "bg-error/10", iconText: "text-error", bar: "bg-error" };

              return (
                <div
                  key={item.id}
                  className="rounded-xl bg-surface-container-low p-6 transition-transform duration-300 hover:translate-y-[-4px]"
                >
                  <div className="mb-6 flex items-start justify-between">
                    <div className={`rounded-xl p-3 ${accent.iconWrap}`}>
                      <span className={`material-symbols-outlined ${accent.iconText}`} data-icon={item.icon}>
                        {item.icon}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold uppercase tracking-tighter text-on-surface-variant">
                        Porsi
                      </div>
                      <div className="text-sm font-bold tnum">{item.percent}%</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="mb-1 text-sm font-medium text-on-surface-variant">{item.name}</h5>
                    <div className="text-2xl font-bold">
                      <SensitiveCurrency value={item.total} showEye={false} />
                    </div>
                    <div className="mt-1 text-xs text-on-surface-variant">{item.count} transaksi</div>
                  </div>

                  <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                    <ProgressBar percent={item.percent} className={accent.bar} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 text-sm text-on-surface-variant">
            Belum ada pengeluaran untuk ditampilkan berdasarkan kategori.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-headline text-lg font-bold text-on-surface">Daftar Transaksi</h3>
          <p className="text-xs text-on-surface-variant">Detail pengeluaran & pemasukan bulan ini</p>
        </div>
        <TransactionList 
          transactions={data ?? []} 
          loading={queryLoading} 
          error={isError} 
          onRetry={refetch}
        />
      </section>
    </div>
  );
}
