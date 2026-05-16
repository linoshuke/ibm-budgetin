"use client";

import { useNonceStyle } from "@/hooks/useNonceStyle";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import type { ReactNode } from "react";

interface Props {
  income: number;
  expense: number;
}

export default function MonthlySummary({ income, expense }: Props) {
  const total = Math.max(income + expense, 1);
  const incomePercent = Math.round((income / total) * 100);
  const expensePercent = Math.round((expense / total) * 100);

  return (
    <section className="glass-panel p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ringkasan Bulan Ini</h2>
        <span className="text-xs text-[var(--text-dimmed)]">Pemasukan vs Pengeluaran</span>
      </div>

      <div className="mt-4 space-y-4">
        <SummaryBar
          label="Pemasukan"
          value={<SensitiveCurrency value={income} className="font-semibold text-[var(--text-primary)]" eyeClassName="h-6 w-6" />}
          percent={incomePercent}
          barClass="from-emerald-500 to-emerald-400"
        />
        <SummaryBar
          label="Pengeluaran"
          value={<SensitiveCurrency value={expense} className="font-semibold text-[var(--text-primary)]" eyeClassName="h-6 w-6" />}
          percent={expensePercent}
          barClass="from-rose-500 to-rose-400"
        />
      </div>
    </section>
  );
}

function SummaryBar({
  label,
  value,
  percent,
  barClass,
}: {
  label: string;
  value: ReactNode;
  percent: number;
  barClass: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-[var(--text-dimmed)]">{label}</span>
        <div className="flex items-center justify-end">{value}</div>
      </div>
      <div className="h-3 rounded-full bg-[var(--bg-card-muted)]">
        <SummaryFill percent={percent} barClass={barClass} />
      </div>
    </div>
  );
}

function SummaryFill({ percent, barClass }: { percent: number; barClass: string }) {
  const width = Math.max(percent, 2);
  const widthClass = useNonceStyle(`width: ${width}%;`);
  return <div className={`h-3 rounded-full bg-gradient-to-r ${barClass} ${widthClass}`} />;
}
