"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import MainHeader from "@/components/navigation/MainHeader";
import WalletFilterModal from "@/components/shared/WalletFilterModal";
import Modal from "@/components/shared/Modal";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import { useTransactionsFilter } from "@/hooks/useTransactionsFilter";
import { useWalletFilter } from "@/hooks/useWalletFilter";
import { useProgressiveRender } from "@/hooks/useProgressiveRender";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import { useAppSettingsStore } from "@/stores/appSettingsStore";
import { calculateTotals, filterTransactionsByDateRange, filterTransactionsByMonth, sortTransactionsByDate } from "@/lib/budget";
import { monthKey } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";
import { TRANSACTIONS_CHANGED_EVENT } from "@/lib/transaction-events";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/hooks/useAuth";

const pageSize = 50;

type ActivityTab = "all" | "pending" | "scheduled";

const TransactionForm = dynamic(() => import("@/components/shared/TransactionForm"), {
  ssr: false,
  loading: () => <div className="h-[520px] w-full rounded-2xl bg-surface-container-low/50" />,
}) as typeof import("@/components/shared/TransactionForm").default;

function isSameDay(date: Date, compare: Date) {
  return (
    date.getFullYear() === compare.getFullYear() &&
    date.getMonth() === compare.getMonth() &&
    date.getDate() === compare.getDate()
  );
}

function resolveIcon(type: Transaction["type"]) {
  return type === "income" ? "payments" : "local_cafe";
}

function resolveActivityStatus(transaction: Transaction): ActivityTab {
  const note = (transaction.note ?? "").toLowerCase();
  if (note.includes("#pending")) return "pending";
  if (note.includes("#scheduled")) return "scheduled";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const txDate = new Date(transaction.date);
  txDate.setHours(0, 0, 0, 0);

  if (txDate > today) return "scheduled";
  if (isSameDay(txDate, today)) return "pending";
  return "all";
}

function TransactionsPageInner() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAnonymous, loading: authLoading } = useAuth();
  const categories = useBudgetStore((state) => state.categories);
  const wallets = useBudgetStore((state) => state.wallets);
  const loading = useBudgetStore((state) => state.loading);
  const defaultPeriod = useAppSettingsStore((state) => state.defaultPeriod);
  const dateLocale = useAppSettingsStore((state) => state.dateLocale);

  const dateFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(dateLocale ?? "id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [dateLocale]);

  const timeFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(dateLocale ?? "id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [dateLocale]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pageOffset, setPageOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [loadError, setLoadError] = useState("");
  const loadingRef = useRef(false);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<ActivityTab>("all");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const handledNewParamRef = useRef(false);
  const canManageWallets = Boolean(user) && !isAnonymous;
  const userId = user?.id ?? null;

  const walletFilter = useWalletFilter();
  // Pisahkan filter dari transactions — tidak meneruskan transactions ke hook
  // agar perubahan data tidak memicu loop filter → fetch → data → filter
  const filter = useTransactionsFilter(defaultPeriod);

  // Stable primitive keys untuk dipakai sebagai dependency (bukan object/array)
  const walletIdsKey = walletFilter.selectedWalletIds.join("|");
  const categoryIdsKey = selectedCategoryIds.join("|");
  const selectedMonthKey = useMemo(
    () => filter.selectedMonth.getFullYear() * 100 + filter.selectedMonth.getMonth(),
    [filter.selectedMonth],
  );

  // Gunakan ref untuk nilai filter agar fetchPage tidak rebuild setiap filter berubah
  const filterRef = useRef({
    period: filter.period,
    selectedMonth: filter.selectedMonth,
    fromDate: filter.fromDate,
    toDate: filter.toDate,
    walletIds: walletFilter.selectedWalletIds,
    categoryIds: selectedCategoryIds,
  });
  useEffect(() => {
    filterRef.current = {
      period: filter.period,
      selectedMonth: filter.selectedMonth,
      fromDate: filter.fromDate,
      toDate: filter.toDate,
      walletIds: walletFilter.selectedWalletIds,
      categoryIds: selectedCategoryIds,
    };
  });

  const fetchPage = useCallback(
    async (offset: number, reset = false) => {
      if (loadingRef.current) return;
      if (!userId) return;
      loadingRef.current = true;
      setLoadingPage(true);
      setLoadError("");

      try {
        const { period, selectedMonth, fromDate, toDate, walletIds, categoryIds } = filterRef.current;

        let dateFrom = "";
        let dateTo = "";
        if (period === "daily") {
          const today = new Date().toISOString().slice(0, 10);
          dateFrom = today;
          dateTo = today;
        } else if (period === "monthly") {
          const year = selectedMonth.getFullYear();
          const month = selectedMonth.getMonth();
          dateFrom = new Date(year, month, 1).toISOString().slice(0, 10);
          dateTo = new Date(year, month + 1, 0).toISOString().slice(0, 10);
        } else {
          dateFrom = fromDate;
          dateTo = toDate;
        }

        const params = new URLSearchParams({
          limit: String(pageSize),
          offset: String(offset),
        });
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (walletIds.length) {
          params.set("walletIds", walletIds.join(","));
        }
        if (categoryIds.length) {
          params.set("categoryIds", categoryIds.join(","));
        }

        const response = await fetch(`/api/transactions?${params.toString()}`, { 
          credentials: "include", 
        }); 
        if (!response.ok) { 
          throw new Error(`HTTP ${response.status}`); 
        } 

        const payload = (await response.json()) as {
          items: Transaction[];
          hasMore: boolean;
          nextOffset: number | null;
        };

        const items = payload.items ?? [];
        setTransactions((prev) => (reset ? items : [...prev, ...items]));
        setHasMore(Boolean(payload.hasMore));
        if (payload.nextOffset !== null) {
          setPageOffset(payload.nextOffset);
        } else {
          setPageOffset(reset ? items.length : offset + items.length);
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : t("transactions.error.loadFailed"));
      } finally {
        loadingRef.current = false;
        setLoadingPage(false);
      }
    },
    // fetchPage tidak bergantung pada nilai filter — dibaca via ref
    [t, userId],
  );

  const refreshTransactions = useCallback(() => {
    if (!userId) return;
    setTransactions([]);
    setPageOffset(0);
    setHasMore(true);
    void fetchPage(0, true);
  }, [fetchPage, userId]);

  // Trigger refresh HANYA saat filter primitif berubah (bukan saat data berubah)
  useEffect(() => {
    if (!userId) return;
    refreshTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    filter.period,
    selectedMonthKey,
    filter.fromDate,
    filter.toDate,
    walletIdsKey,
    categoryIdsKey,
  ]);

  useEffect(() => {
    const handleChanged = () => refreshTransactions();
    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, handleChanged);
    return () => window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, handleChanged);
  }, [refreshTransactions]);

  useEffect(() => {
    const newParam = searchParams.get("new");
    if (newParam === "1" && !handledNewParamRef.current) {
      handledNewParamRef.current = true;
      setEditingTransaction(null);
      setShowTransactionModal(true);

      const params = new URLSearchParams(searchParams.toString());
      params.delete("new");
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl as import("next").Route, { scroll: false });
      return;
    }

    if (newParam !== "1") {
      handledNewParamRef.current = false;
    }
  }, [pathname, router, searchParams]);

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.id, item])),
    [categories],
  );
  const walletMap = useMemo(
    () => new Map(wallets.map((item) => [item.id, item.name])),
    [wallets],
  );

  // Filtering data dilakukan di sini (bukan di hook) agar tidak ada circular dependency
  const filteredTransactions = useMemo(() => {
    let items = transactions;

    if (walletFilter.selectedWalletIds.length > 0) {
      items = items.filter((item) => walletFilter.selectedWalletIds.includes(item.walletId));
    }

    if (filter.period === "daily") {
      const today = new Date();
      return sortTransactionsByDate(
        items.filter((item) => {
          const d = new Date(item.date);
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
          );
        }),
      );
    }

    if (filter.period === "monthly") {
      return sortTransactionsByDate(filterTransactionsByMonth(items, monthKey(filter.selectedMonth)));
    }

    return sortTransactionsByDate(filterTransactionsByDateRange(items, filter.fromDate, filter.toDate));
  }, [
    transactions,
    walletFilter.selectedWalletIds,
    filter.period,
    filter.fromDate,
    filter.toDate,
    filter.selectedMonth,
  ]);

  const totals = useMemo(
    () => calculateTotals(filteredTransactions),
    [filteredTransactions],
  );

  const spendingTrend = useMemo(() => {
    const trendMonth = filter.period === "monthly" ? filter.selectedMonth : new Date();
    const monthStart = new Date(trendMonth.getFullYear(), trendMonth.getMonth(), 1);
    const nextMonthStart = new Date(trendMonth.getFullYear(), trendMonth.getMonth() + 1, 1);
    const prevMonthStart = new Date(trendMonth.getFullYear(), trendMonth.getMonth() - 1, 1);

    const walletSet = new Set(walletFilter.selectedWalletIds);
    const categorySet = new Set(selectedCategoryIds);

    let currentExpense = 0;
    let previousExpense = 0;

    transactions.forEach((item) => {
      if (walletSet.size && !walletSet.has(item.walletId)) return;
      if (categorySet.size && !categorySet.has(item.categoryId)) return;

      const date = new Date(item.date);
      if (date >= monthStart && date < nextMonthStart) {
        if (item.type === "expense") currentExpense += item.amount;
        return;
      }
      if (date >= prevMonthStart && date < monthStart) {
        if (item.type === "expense") previousExpense += item.amount;
      }
    });

    const delta = currentExpense - previousExpense;
    const percent =
      previousExpense === 0
        ? currentExpense === 0
          ? 0
          : 100
        : (delta / Math.abs(previousExpense)) * 100;

    return {
      percent,
      increase: delta > 0,
      label: `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}% dari bulan lalu`,
    };
  }, [filter.period, filter.selectedMonth, selectedCategoryIds, transactions, walletFilter.selectedWalletIds]);

  const largestExpense = useMemo(() => {
    const expenseItems = filteredTransactions.filter((item) => item.type === "expense");
    if (!expenseItems.length) return null;
    return expenseItems.reduce((max, item) => (item.amount > max.amount ? item : max), expenseItems[0]);
  }, [filteredTransactions]);

  const searchKey = searchQuery.trim().toLowerCase();
  const visibleTransactions = useMemo(() => {
    let items = filteredTransactions;

    if (activeActivityTab !== "all") {
      items = items.filter((item) => resolveActivityStatus(item) === activeActivityTab);
    }

    if (selectedCategoryIds.length > 0) {
      items = items.filter((item) => selectedCategoryIds.includes(item.categoryId));
    }

    if (!searchKey) return items;

    return items.filter((item) => {
      const categoryName = categoryMap.get(item.categoryId)?.name ?? "";
      const walletName = walletMap.get(item.walletId) ?? "";
      const note = item.note ?? "";
      return [categoryName, walletName, note].some((field) => field.toLowerCase().includes(searchKey));
    });
  }, [
    activeActivityTab,
    categoryMap,
    filteredTransactions,
    searchKey,
    selectedCategoryIds,
    walletMap,
  ]);

  const pagedTransactions = visibleTransactions;
  const walletResetKey = walletFilter.selectedWalletIds.join(",");
  const categoryResetKey = selectedCategoryIds.join(",");
  const renderResetKey = useMemo(() => {
    return [
      activeActivityTab,
      searchKey,
      categoryResetKey,
      walletResetKey,
      filter.period,
      filter.fromDate,
      filter.toDate,
      filter.selectedMonth.getTime(),
    ].join("|");
  }, [
    activeActivityTab,
    categoryResetKey,
    filter.fromDate,
    filter.period,
    filter.selectedMonth,
    filter.toDate,
    searchKey,
    walletResetKey,
  ]);

  const { rendered: renderedTransactions, canRenderMore, sentinelRef } = useProgressiveRender(pagedTransactions, {
    initial: 60,
    step: 60,
    resetKey: renderResetKey,
  });

  if (authLoading || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent-indigo)]/30 border-t-[var(--accent-indigo)]" />
      </div>
    );
  }

  const handleSubmit = async (payload: Omit<Transaction, "id">) => {
    try {
      setSavingTransaction(true);
      if (editingTransaction) {
        await budgetActions.updateTransaction(editingTransaction.id, payload);
      } else {
        await budgetActions.addTransaction(payload);
      }
      setShowTransactionModal(false);
      setEditingTransaction(null);
    } catch (err) {
      console.error("Gagal menyimpan transaksi:", err);
    } finally {
      setSavingTransaction(false);
    }
  };

  const formDisabled = loading || savingTransaction;

  return (
    <>
      <MainHeader
        title={t("nav.transactions")}
        tabs={[
          { key: "all", label: t("transactions.activity.all") },
          { key: "pending", label: t("transactions.activity.pending") },
          { key: "scheduled", label: t("transactions.activity.scheduled") },
        ]}
        activeTab={activeActivityTab}
        onTabChange={(key) => setActiveActivityTab(key as ActivityTab)}
      />

      <section className="flex flex-col gap-6 px-6 pb-28 pt-6 md:px-8 lg:pb-6">
        <div className="flex flex-col items-center gap-4 rounded-xl bg-surface-container-low p-4 md:flex-row md:justify-between">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">
              search
            </span>
            <input
              className="w-full rounded-lg border-none bg-surface-container py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant transition-all focus:bg-surface-container-high focus:ring-1 focus:ring-primary"
              placeholder={t("transactions.searchPlaceholder")}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
              <div className="flex w-full items-center gap-3 md:w-auto">
                <button
                  type="button"
                  onClick={() => setShowDateFilter((prev) => !prev)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container px-4 py-3 text-on-surface transition-all hover:bg-surface-container-highest md:flex-none"
                >
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  <span className="text-sm font-medium">{t("transactions.filter.date")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryFilter(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container px-4 py-3 text-on-surface transition-all hover:bg-surface-container-highest md:flex-none"
                >
                  <span className="material-symbols-outlined text-lg">category</span>
                  <span className="text-sm font-medium">{t("transactions.filter.category")}</span>
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container px-4 py-3 text-on-surface transition-all hover:bg-surface-container-highest md:flex-none"
                >
                  <span className="material-symbols-outlined text-lg">filter_list</span>
                  <span className="text-sm font-medium">{t("transactions.filter.amount")}</span>
                </button>
              </div>
            </div>

            {showDateFilter ? (
              <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
                <div className="grid grid-cols-3 gap-2">
                  {(["daily", "monthly", "range"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`rounded-lg py-2 text-sm font-semibold ${
                        filter.period === mode
                          ? "bg-surface-container-highest text-on-surface"
                          : "text-on-surface-variant"
                      }`}
                      onClick={() => filter.setPeriod(mode)}
                    >
                      {t(`transactions.period.${mode}`)}
                    </button>
                  ))}
                </div>

                {filter.period === "monthly" ? (
                  <div className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container px-3 py-2">
                    <button
                      type="button"
                      className="rounded-lg p-2 text-on-surface-variant hover:text-on-surface"
                      onClick={filter.goPrevMonth}
                    >
                      {"<"}
                    </button>
                    <span className="text-sm font-semibold text-on-surface">{filter.monthLabel}</span>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                      onClick={filter.goNextMonth}
                      disabled={!filter.canGoNext}
                    >
                      {">"}
                    </button>
                  </div>
                ) : null}

                {filter.period === "range" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm text-on-surface-variant">
                      {t("transactions.range.from")}
                      <input
                        type="date"
                        value={filter.fromDate}
                        onChange={(event) => filter.setFromDate(event.target.value)}
                        className="w-full rounded-lg border border-outline-variant/10 bg-surface-container px-3 py-2 text-on-surface"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-on-surface-variant">
                      {t("transactions.range.to")}
                      <input
                        type="date"
                        value={filter.toDate}
                        onChange={(event) => filter.setToDate(event.target.value)}
                        className="w-full rounded-lg border border-outline-variant/10 bg-surface-container px-3 py-2 text-on-surface"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-outline-variant/5 bg-surface-container p-6">
                <p className="mb-2 font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t("transactions.stats.monthlySpending")}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <h2 className="min-w-0 font-headline font-extrabold leading-tight text-on-surface sm:leading-none text-[clamp(1.5rem,6vw,1.875rem)]">
                    <SensitiveCurrency
                      value={Math.abs(totals.expense)}
                      className="break-words"
                      wrapperClassName="min-w-0 max-w-full flex-wrap gap-2"
                      eyeClassName="h-6 w-6"
                    />
                  </h2>
                  <span
                    className={`flex items-center gap-1 text-sm font-bold sm:justify-end ${
                      spendingTrend.increase ? "text-error" : "text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {spendingTrend.increase ? "trending_up" : "trending_down"}
                    </span>
                    {spendingTrend.label}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant/5 bg-surface-container p-6">
                <p className="mb-2 font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t("transactions.stats.largestExpense")}
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="min-w-0 font-headline font-extrabold leading-tight text-on-surface sm:leading-none text-[clamp(1.5rem,6vw,1.875rem)]">
                      <SensitiveCurrency
                        value={Math.abs(largestExpense?.amount ?? 0)}
                        className="break-words"
                        wrapperClassName="min-w-0 max-w-full flex-wrap gap-2"
                        eyeClassName="h-6 w-6"
                      />
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      {largestExpense ? categoryMap.get(largestExpense.categoryId)?.name ?? t("common.uncategorized") : "-"}
                    </p>
                  </div>

                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingTransaction(null);
                  setShowTransactionModal(true);
                }}
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-outline-variant/5 bg-surface-container-low p-6 transition-all hover:bg-surface-container-highest"
              >
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-3xl text-primary">add</span>
                </div>
                <p className="font-headline font-bold text-primary">{t("transactions.newTransaction")}</p>
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-outline-variant/5 bg-surface-container-low">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-high/60 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      <th className="px-8 py-5">{t("transactions.table.date")}</th>
                      <th className="px-6 py-5">{t("transactions.table.description")}</th>
                      <th className="px-6 py-5">{t("transactions.table.category")}</th>
                      <th className="px-6 py-5">{t("transactions.table.account")}</th>
                      <th className="px-6 py-5 text-right">{t("transactions.table.amount")}</th>
                      <th className="px-8 py-5 text-right">{t("transactions.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                        {renderedTransactions.map((transaction) => {
                          const category = categoryMap.get(transaction.categoryId);
                          const walletName = walletMap.get(transaction.walletId) ?? t("common.noWallet");
                          const description = transaction.note || category?.name || t("common.transaction");
                          const subtitle = transaction.note
                            ? category?.name ?? t("common.uncategorized")
                            : t("transactions.subtitle.activity");
                          const iconName = resolveIcon(transaction.type);
                          const dateValue = new Date(transaction.date);
                      const tone = transaction.type === "income" ? "primary" : "tertiary";
                      return (
                        <tr key={transaction.id} className="group cursor-default transition-all hover:bg-surface-container">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="tnum font-semibold text-on-surface">
                                {dateFormatter.format(dateValue)}
                              </span>
                              <span className="text-xs text-on-surface-variant">{timeFormatter.format(dateValue)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-highest text-primary">
                                  <span className="material-symbols-outlined icon-fill">
                                    {iconName}
                                  </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-on-surface">{description}</span>
                                <span className="text-xs text-on-surface-variant">{subtitle}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <span
                              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                tone === "primary"
                                  ? "border-primary/30 bg-primary/20 text-primary-fixed"
                                  : "border-tertiary/20 bg-tertiary/5 text-tertiary"
                              }`}
                            >
                              {category?.name ?? t("common.uncategorized")}
                            </span>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-on-surface-variant">credit_card</span>
                              <span className="text-sm text-on-surface-variant">{walletName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <span
                              className={`tnum font-bold ${
                                transaction.type === "income" ? "text-primary" : "text-on-surface"
                              }`}
                            >
                              {transaction.type === "income" ? "+" : "-"}
                              <SensitiveCurrency
                                value={Math.abs(transaction.amount)}
                                className={transaction.type === "income" ? "text-primary" : "text-on-surface"}
                                eyeClassName="h-6 w-6 border-transparent bg-transparent hover:bg-surface-container"
                                wrapperClassName="gap-1"
                              />
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                className="p-2 text-on-surface-variant transition-colors hover:text-primary"
                                onClick={() => {
                                  setEditingTransaction(transaction);
                                  setShowTransactionModal(true);
                                }}
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                type="button"
                                className="p-2 text-on-surface-variant transition-colors hover:text-error"
                                onClick={async () => {
                                  const confirmed = window.confirm(t("transactions.confirmDelete"));
                                  if (!confirmed) return;
                                  await budgetActions.deleteTransaction(transaction.id);
                                }}
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {canRenderMore ? (
                      <tr
                        ref={(node) => {
                          sentinelRef.current = node;
                        }}
                      >
                        <td colSpan={6} className="px-8 py-5 text-center text-xs text-on-surface-variant">
                          {t("transactions.loading")}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              <p className="text-sm font-medium text-on-surface-variant">
                {t("transactions.showingPrefix")} {renderedTransactions.length} {t("transactions.showingSuffix")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {loadError ? (
                  <span className="text-xs text-error">{loadError}</span>
                ) : null}
                {hasMore ? (
                  <button
                    type="button"
                    onClick={() => fetchPage(pageOffset, false)}
                    disabled={loadingPage}
                    className="rounded-lg border border-primary/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 disabled:opacity-60"
                  >
                    {loadingPage ? t("transactions.loading") : t("transactions.loadMore")}
                  </button>
                ) : (
                  <span className="text-xs text-on-surface-variant">{t("transactions.allShown")}</span>
                )}
              </div>
            </div>
      </section>

      <WalletFilterModal
        open={walletFilter.open}
        wallets={wallets}
        draftWalletIds={walletFilter.draftWalletIds}
        onToggle={walletFilter.toggleWallet}
        onApply={walletFilter.applyFilter}
        onClose={walletFilter.closeFilter}
      />

      <Modal
        open={showCategoryFilter}
        title={t("transactions.filterCategoryTitle")}
        onClose={() => setShowCategoryFilter(false)}
        sizeClassName="max-w-lg"
      >
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">{t("transactions.filterCategoryDesc")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {categories.map((category) => {
                const checked = selectedCategoryIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryIds((prev) =>
                        checked ? prev.filter((id) => id !== category.id) : [...prev, category.id],
                      );
                    }}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                      checked
                        ? "border-primary/30 bg-primary/10 text-on-surface"
                        : "border-outline-variant/10 bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="material-symbols-outlined text-base">
                      {checked ? "check_circle" : "radio_button_unchecked"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategoryIds([])}
                className="rounded-lg border border-outline-variant/20 px-3 py-2 text-sm text-on-surface-variant hover:text-on-surface"
              >
                {t("transactions.reset")}
              </button>
              <button
                type="button"
                onClick={() => setShowCategoryFilter(false)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
              >
                {t("transactions.apply")}
              </button>
            </div>
          </div>
      </Modal>

      <Modal
        open={showTransactionModal}
        title={editingTransaction ? t("transactions.modal.edit") : t("transactions.modal.add")}
        onClose={() => {
          setShowTransactionModal(false);
          setEditingTransaction(null);
        }}
        sizeClassName="max-w-4xl"
      >
          <TransactionForm
            key={editingTransaction?.id ?? (showTransactionModal ? "transaction-modal" : "transaction-hidden")}
            categories={categories}
            wallets={wallets}
            onSubmit={handleSubmit}
            onCreateWallet={canManageWallets ? (payload) => budgetActions.addWallet(payload) : undefined}
            submitLabel={editingTransaction ? t("transactions.submit.edit") : t("transactions.submit.add")}
            onCancel={() => {
              setShowTransactionModal(false);
              setEditingTransaction(null);
            }}
            disabled={formDisabled}
            initialValue={editingTransaction ?? undefined}
          />
      </Modal>
    </>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <TransactionsPageInner />
    </Suspense>
  );
}
