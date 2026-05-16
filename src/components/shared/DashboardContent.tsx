import { cn } from "@/lib/utils";
import type { CategoryBreakdown, Totals } from "@/lib/budget";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import type { Wallet } from "@/types/wallet";
import StatCard from "@/components/shared/StatCard";
import MonthlySummary from "@/components/shared/MonthlySummary";
import TransactionList from "@/components/shared/TransactionList";
import ExpenseChart from "@/components/shared/ExpenseChart";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import type { ReactNode } from "react";

interface DashboardContentProps {
  totals: Totals;
  monthTotals: Totals;
  monthIncomeCount: number;
  monthExpenseCount: number;
  recent: Transaction[];
  expenseRows: CategoryBreakdown[];
  categories: Category[];
  wallets: Wallet[];
  toolbar?: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export default function DashboardContent({
  totals,
  monthTotals,
  monthIncomeCount,
  monthExpenseCount,
  recent,
  expenseRows,
  categories,
  wallets,
  toolbar,
  sidebar,
  className,
}: DashboardContentProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {toolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-dimmed)]">Ringkasan</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Dashboard Keuangan</h2>
          </div>
          <div className="flex items-center gap-2">{toolbar}</div>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Saldo Total"
          value={<SensitiveCurrency value={totals.balance} eyeClassName="h-6 w-6" />}
          helper="Pemasukan dikurangi pengeluaran"
          accent="teal"
        />
        <StatCard
          title="Pemasukan Bulan Ini"
          value={<SensitiveCurrency value={monthTotals.income} eyeClassName="h-6 w-6" />}
          helper={`${monthIncomeCount} transaksi`}
          accent="emerald"
        />
        <StatCard
          title="Pengeluaran Bulan Ini"
          value={<SensitiveCurrency value={monthTotals.expense} eyeClassName="h-6 w-6" />}
          helper={`${monthExpenseCount} transaksi`}
          accent="rose"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <MonthlySummary income={monthTotals.income} expense={monthTotals.expense} />
          <ExpenseChart rows={expenseRows} />
          <TransactionList
            title="Recent Transactions"
            subtitle="Menampilkan 8 transaksi terbaru"
            transactions={recent}
            categories={categories}
            wallets={wallets}
          />
        </div>
        {sidebar ? (
          <div className="lg:col-span-4 lg:sticky lg:top-24">{sidebar}</div>
        ) : null}
      </section>
    </div>
  );
}
