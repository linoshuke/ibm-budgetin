import type { Totals } from "@/lib/budget";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

interface SidebarProps {
  totals: Totals;
}

export default function Sidebar({ totals }: SidebarProps) {
  return (
    <aside className="glass-panel h-fit space-y-4 p-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Ringkasan Cepat</h2>
        <div className="mt-3 space-y-2 text-sm">
          <SummaryRow label="Saldo Total" value={<SensitiveCurrency value={totals.balance} eyeClassName="h-6 w-6" />} />
          <SummaryRow label="Pemasukan" value={<SensitiveCurrency value={totals.income} className="text-emerald-400" eyeClassName="h-6 w-6 border-transparent bg-transparent hover:bg-[var(--bg-card)]" />} />
          <SummaryRow label="Pengeluaran" value={<SensitiveCurrency value={totals.expense} className="text-rose-400" eyeClassName="h-6 w-6 border-transparent bg-transparent hover:bg-[var(--bg-card)]" />} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Navigasi Cepat</h2>
        <div className="mt-3 space-y-2 text-sm">
          <QuickLink href={"/wallets" as Route} label="Kelola wallet" />
          <QuickLink href={"/categories" as Route} label="Kelola kategori" />
          <QuickLink href={"/reports" as Route} label="Buka laporan bulanan" />
        </div>
      </div>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2">
      <span className="text-[var(--text-dimmed)]">{label}</span>
      <span className={valueClass ?? "text-[var(--text-primary)]"}>{value}</span>
    </div>
  );
}

function QuickLink({ href, label }: { href: Route; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
    >
      <span>{label}</span>
      <span className="text-xs text-[var(--text-dimmed)]">Buka</span>
    </Link>
  );
}
