"use client";

import { useNonceStyle } from "@/hooks/useNonceStyle";
import type { CategoryBreakdown } from "@/lib/budget";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";

interface ExpenseChartProps {
  rows: CategoryBreakdown[];
}

export default function ExpenseChart({ rows }: ExpenseChartProps) {
  return (
    <section className="glass-panel p-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Visual Pengeluaran per Kategori</h2>
      <p className="mt-1 text-xs text-[var(--text-dimmed)]">
        Diagram batang sederhana dari nominal pengeluaran terbesar.
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-dimmed)]">
          Belum ada data pengeluaran pada rentang waktu ini.
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.category.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-[var(--text-primary)]">{row.category.name}</span>
              <span className="inline-flex items-center gap-2 text-[var(--text-dimmed)]">
                <SensitiveCurrency value={row.amount} eyeClassName="h-6 w-6" />
                <span>({row.percent}%)</span>
              </span>
            </div>
            <div className="h-3 rounded-full bg-[var(--bg-card-muted)]">
              <ExpenseBar percent={row.percent} color={row.category.color} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExpenseBar({ percent, color }: { percent: number; color: string }) {
  const width = Math.max(percent, 4);
  const barClass = useNonceStyle(`width: ${width}%; background-color: ${color};`);
  return <div className={`h-3 rounded-full ${barClass}`} />;
}
