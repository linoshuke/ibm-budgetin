"use client";

import { useMemo } from "react";
import { useWalletStore } from "@/stores/walletStore";
import { useUIStore } from "@/stores/uiStore";
import { useBudgetStore } from "@/store/budgetStore";
import { useMonthlySummary } from "@/hooks/useTransactions";
import { useI18n } from "@/hooks/useI18n";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function TotalBalanceCard() {
  const { t, language } = useI18n();
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);
  const openModal = useUIStore((state) => state.openModal);
  const transactions = useBudgetStore((state) => state.transactions);
  const wallets = useBudgetStore((state) => state.wallets);

  const totalBalance = useMemo(() => {
    const ids = selectedWalletIds.length ? selectedWalletIds : wallets.map((wallet) => wallet.id);
    return wallets
      .filter((wallet) => ids.includes(wallet.id))
      .reduce((sum, wallet) => sum + Number(wallet.balance ?? 0), 0);
  }, [selectedWalletIds, wallets]);

  const now = new Date();
  const currentMonth = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = { year: prevMonthDate.getFullYear(), month: prevMonthDate.getMonth() + 1 };

  const { data: currentSummary } = useMonthlySummary(selectedWalletIds, currentMonth);
  const { data: prevSummary } = useMonthlySummary(selectedWalletIds, prevMonth);

  const openDialog = () => openModal("walletSelection");
  const { trendLabel, trendTone, lastSyncLabel } = useMemo(() => {
    if (!transactions.length && !currentSummary && !prevSummary) {
      return {
        trendLabel: "+0.0%",
        trendTone: "primary" as const,
        lastSyncLabel: t("home.noData"),
      };
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const netThis = (currentSummary?.total_income ?? 0) - (currentSummary?.total_expense ?? 0);
    const netPrev = (prevSummary?.total_income ?? 0) - (prevSummary?.total_expense ?? 0);
    let latest: Date | null = null;

    for (const item of transactions) {
      const date = new Date(item.date);
      if (!latest || date > latest) {
        latest = date;
      }
    }

    const base = Math.abs(netPrev);
    let percent = 0;
    if (base > 0) {
      percent = ((netThis - netPrev) / base) * 100;
    } else if (netThis !== 0) {
      percent = 100;
    }

    const trendLabel = `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
    const trendTone = percent >= 0 ? "primary" : "error";

    const diffDays = latest
      ? Math.max(0, Math.floor((todayStart.getTime() - latest.getTime()) / DAY_MS))
      : null;
    const lastSyncLabel =
      diffDays === null
        ? t("home.noData")
        : diffDays === 0
          ? t("home.today")
          : `${diffDays} ${t("home.daysAgoSuffix")}`;

    return { trendLabel, trendTone, lastSyncLabel };
  }, [currentSummary, prevSummary, t, transactions, language]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openDialog}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDialog();
        }
      }}
      className="group/card relative overflow-visible rounded-xl bg-gradient-to-br from-[#1a202a] to-[#0e141d] p-8 text-left shadow-2xl shadow-[#080e18]/50 transition-transform hover:-translate-y-1"
    >
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-[80px] transition-colors group-hover/card:bg-primary/20" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-sm font-medium text-on-surface-variant">
            <span>{t("home.totalNetWorth")}</span>
            <div className="relative">
              <button
                type="button"
                className="group/info flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 text-[12px] text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                aria-label={t("home.totalNetWorth")}
              >
                i
                <span className="pointer-events-none absolute left-full top-1/2 z-[9999] ml-2 w-56 -translate-y-1/2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 text-[10px] text-on-surface-variant opacity-0 shadow-xl transition-opacity group-hover/info:opacity-100 group-focus-visible/info:opacity-100">
                  {t("home.totalNetWorth_info")}
                </span>
              </button>
            </div>
          </div>
          <h1 className="mt-2 flex items-center gap-3 text-4xl font-extrabold tracking-tighter text-on-surface md:text-5xl">
            <SensitiveCurrency
              value={totalBalance}
              eyeClassName="h-9 w-9 border-outline-variant/20 bg-surface-container-low/30 hover:bg-surface-container"
            />
          </h1>
          <p className="mt-2 text-xs text-on-surface-variant">
            {selectedWalletIds.length
              ? t("home.walletsSelected").replace("{count}", String(selectedWalletIds.length))
              : t("home.allWallets")}
          </p>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <div
            className={`flex items-center space-x-2 rounded-full px-4 py-2 backdrop-blur-md ${
              trendTone === "primary"
                ? "border border-primary/20 bg-primary/10"
                : "border border-error/30 bg-error/10"
            }`}
          >
            <span
              className={`material-symbols-outlined ${trendTone === "primary" ? "text-primary" : "text-error"}`}
              data-icon={trendTone === "primary" ? "trending_up" : "trending_down"}
            >
              {trendTone === "primary" ? "trending_up" : "trending_down"}
            </span>
            <span className={`text-sm font-bold ${trendTone === "primary" ? "text-primary" : "text-error"}`}>
              {trendLabel} <span className="font-normal opacity-70">{t("home.thisMonth")}</span>
            </span>
          </div>
          <div className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
            {t("home.lastSync")}: {lastSyncLabel}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-0 right-0 h-full w-1/2 opacity-20">
        <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 200 100">
          <path d="M0,80 Q50,70 100,40 T200,20 L200,100 L0,100 Z" fill="url(#hero-gradient)" />
          <defs>
            <linearGradient id="hero-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#7cebff" stopOpacity="1" />
              <stop offset="100%" stopColor="#7cebff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
