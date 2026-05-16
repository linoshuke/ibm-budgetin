"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import TotalBalanceCard from "@/components/home/TotalBalanceCard";
import MonthlySummary from "@/components/home/MonthlySummary";
import WalletSelectionDialog from "@/components/modals/WalletSelectionDialog";
import ChartDeferred from "@/components/shared/ChartDeferred";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import { useBudgetStore } from "@/store/budgetStore";
import { formatDate } from "@/lib/utils";
import type { Category } from "@/types/category";
import { useI18n } from "@/hooks/useI18n";

const CashFlowChartCard = dynamic(() => import("@/components/home/CashFlowChartCard"), {
  ssr: false,
  loading: () => <div className="h-[320px] rounded-xl bg-surface-container-low/50" />,
});

const ExpenseChart = dynamic(() => import("@/components/home/ExpenseChart"), {
  ssr: false,
  loading: () => <div className="h-[340px] rounded-xl bg-surface-container-low/50" />,
});

const DAY_MS = 24 * 60 * 60 * 1000;

function resolveCategoryIcon(category: Category | undefined) {
  const code = category?.icon?.toUpperCase();
  const name = category?.name?.toLowerCase() ?? "";

  const codeMap: Record<string, string> = {
    FOOD: "shopping_cart",
    MOVE: "directions_car",
    BILL: "home",
    PAY: "payments",
    PLUS: "savings",
    FUN: "movie",
    HEALTH: "favorite",
  };

  if (code && codeMap[code]) return codeMap[code];
  if (name.includes("makan") || name.includes("food") || name.includes("grocery")) return "shopping_cart";
  if (name.includes("transport") || name.includes("bensin") || name.includes("travel")) return "directions_car";
  if (name.includes("tagih") || name.includes("bill") || name.includes("util") || name.includes("sewa")) return "home";
  if (name.includes("hibur") || name.includes("entertain") || name.includes("movie")) return "movie";
  if (name.includes("kesehatan") || name.includes("health") || name.includes("med")) return "favorite";
  if (name.includes("gaji") || name.includes("income")) return "payments";
  return "category";
}

export default function HomeClient() {
  const { t, language } = useI18n();
  const router = useRouter();
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);

  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);

  const recentTransactions = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return sorted.slice(0, 5).map((item) => {
      const category = categoryMap.get(item.categoryId);
      const title = (item.note ?? "").trim() || category?.name || t("common.transaction");
      const amountValue = Math.abs(item.amount);
      return {
        title,
        category: category?.name ?? t("common.uncategorized"),
        date: formatDate(item.date, true),
        amount: amountValue,
        type: item.type,
        status: item.type === "income" ? t("common.income") : t("common.expense"),
        icon: resolveCategoryIcon(category),
        tone: item.type === "income" ? "primary" : "error",
      };
    });
  }, [categoryMap, t, transactions, language]);

  const upcomingBills = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const upcoming = transactions
      .filter((item) => item.isBill === true)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);

    return upcoming.map((item) => {
      const category = categoryMap.get(item.categoryId);
      const title = (item.note ?? "").trim() || category?.name || t("home.upcomingBills");
      const dateValue = new Date(item.date);
      const diffDays = Math.max(0, Math.ceil((dateValue.getTime() - todayStart.getTime()) / DAY_MS));
      const meta =
        diffDays === 0
          ? t("home.dueToday")
          : diffDays === 1
            ? t("home.dueTomorrow")
            : `${t("home.dueInPrefix")} ${diffDays} ${t("home.dueInSuffix")}`;
      const isUrgent = diffDays <= 1;

      return {
        title,
        meta,
        amount: Math.abs(item.amount),
        status: isUrgent ? t("home.status.urgent") : t("home.status.pending"),
        tone: isUrgent ? "error" : "primary",
        action: isUrgent ? t("home.action.pay") : t("home.action.autopay"),
      };
    });
  }, [categoryMap, t, transactions, language]);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <TotalBalanceCard />
        </div>
        <MonthlySummary />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <ChartDeferred
          className="w-full lg:col-span-2"
          fallback={<div className="h-[320px] rounded-xl bg-surface-container-low/50" />}
        >
          <CashFlowChartCard />
        </ChartDeferred>
        <ChartDeferred
          className="w-full"
          fallback={<div className="h-[340px] rounded-xl bg-surface-container-low/50" />}
        >
          <ExpenseChart />
        </ChartDeferred>
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-xl font-bold">{t("home.recentTransactions")}</h3>
            <button
              className="text-sm font-bold text-primary hover:underline"
              type="button"
              onClick={() => router.push("/transactions" as Route)}
            >
              {t("home.viewAll")}
            </button>
          </div>
          <div className="overflow-hidden rounded-xl bg-surface-container-low">
            <div className="divide-y divide-outline-variant/5">
              {recentTransactions.length ? (
                recentTransactions.map((item) => (
                  <div
                    key={`${item.title}-${item.date}`}
                    className="group flex items-center justify-between p-4 transition-colors hover:bg-surface-container"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-highest transition-colors group-hover:bg-primary/20">
                        <span className="material-symbols-outlined text-primary" data-icon={item.icon}>
                          {item.icon}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-on-surface">{item.title}</div>
                        <div className="text-xs text-on-surface-variant">
                          {item.category} - {item.date}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 text-sm font-bold ${item.tone === "primary" ? "text-primary" : "text-error"}`}>
                        <span>{item.type === "income" ? "+" : "-"}</span>
                        <SensitiveCurrency
                          value={item.amount}
                          className={item.tone === "primary" ? "text-primary" : "text-error"}
                          eyeClassName="h-6 w-6 border-transparent bg-transparent hover:bg-surface-container"
                          wrapperClassName="gap-1"
                        />
                      </div>
                      <div className="text-[10px] font-medium uppercase text-on-surface-variant">{item.status}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-sm text-on-surface-variant">
                  {t("home.noRecentTransactions")}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-6 font-headline text-xl font-bold">{t("home.upcomingBills")}</h3>
          <div className="space-y-4">
            {upcomingBills.length ? (
              upcomingBills.map((bill) => (
                <div
                  key={`${bill.title}-${bill.meta}`}
                  className={`rounded-xl bg-surface-container-low p-5 ${
                    bill.tone === "primary"
                      ? "border-l-4 border-primary shadow-lg shadow-[#000]/10"
                      : bill.tone === "secondary"
                        ? "border-l-4 border-secondary-container opacity-80 transition-opacity hover:opacity-100"
                        : "border-l-4 border-error/50"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold">{bill.title}</div>
                      <div className="text-xs text-on-surface-variant">{bill.meta}</div>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        bill.tone === "primary"
                          ? "bg-primary/10 text-primary"
                          : bill.tone === "secondary"
                            ? "bg-secondary-container/10 text-secondary-container"
                            : "bg-error/10 text-error"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-xl font-bold">
                      <SensitiveCurrency value={bill.amount} eyeClassName="h-7 w-7" />
                    </div>
                    {bill.action === "check_circle" ? (
                      <span
                        className="material-symbols-outlined icon-fill text-secondary-container"
                        data-icon="check_circle"
                      >
                        check_circle
                      </span>
                    ) : (
                      <button
                        className={`rounded-md px-3 py-1 text-xs font-bold ${
                          bill.tone === "primary"
                            ? "bg-surface-container-highest hover:bg-surface-bright"
                            : "bg-gradient-to-r from-primary to-secondary-container text-on-primary"
                        }`}
                        type="button"
                      >
                        {bill.action}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-surface-container-low p-5 text-sm text-on-surface-variant">
                {t("home.noUpcomingBills")}
              </div>
            )}
            <div className="group relative mt-8 overflow-hidden rounded-xl bg-surface-container-low p-6">
              <Image
                alt="savings"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 transition-transform duration-700 group-hover:scale-100"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDS7Oulg72mB7ehDrhVmR4n-GKvEsVzEXy0zqmJHKYe9zR6A9pdksZsP3QzQO8gFP4Su6JKz3xDNQwx23uVWeyU-INwSwPqPLE2aFIYAS1wS0_q_cKtOvFAnsAI78fAb_pDhfTtHxUMXxSR_IDekYuzEdDPm7RO-5hXHsGigj9dRJsah2g8Xp1ow-W-yUQyWSheWNV5pLNAp6dWwG4IMCb3yUTdbR8jqNP4eOGsGQclbLDSMRSgAb5za7RBRzAvj4k1J_TSX0Jgz2Pq"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                loading="lazy"
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold text-primary">{t("home.smartSavings.title")}</div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                    {t("home.smartSavings.status")}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                  {t("home.smartSavings.body")}
                </p>
                <button className="group mt-4 flex items-center space-x-2 text-xs font-bold text-on-surface" type="button">
                  <span>{t("home.smartSavings.cta")}</span>
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WalletSelectionDialog />
    </div>
  );
}
