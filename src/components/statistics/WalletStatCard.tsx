"use client";

import { useAppSettingsStore } from "@/stores/appSettingsStore";
import { useEffect, useMemo, useState } from "react";
import { useNonceStyle } from "@/hooks/useNonceStyle";

interface WalletStatCardProps {
  walletName: string;
  data: Array<{ day: string; income: number; expense: number; items?: Array<{ description: string; amount: number; type: string }> }>;
}

function maskDigits(input: string) {
  return input.replace(/\d/g, "•");
}

function DayTooltip({
  day,
  incomeValue,
  expenseValue,
  items,
  formatValue,
}: {
  day: string;
  incomeValue: number;
  expenseValue: number;
  items: Array<{ description: string; amount: number; type: string }>;
  formatValue: (value: number) => string;
}) {
  return (
    <div className="w-max max-w-[240px] rounded-xl border border-white/10 bg-[var(--bg-card)] p-3 text-xs text-[var(--text-primary)] shadow-xl">
      <p className="font-semibold">Hari {day}</p>
      <div className="mt-2 grid gap-1">
        <div className="flex justify-between gap-4 text-emerald-300">
          <span>Pemasukan</span>
          <span className="tnum">{formatValue(Math.abs(Number(incomeValue)))}</span>
        </div>
        <div className="flex justify-between gap-4 text-rose-300">
          <span>Pengeluaran</span>
          <span className="tnum">{formatValue(Math.abs(Number(expenseValue)))}</span>
        </div>
      </div>
      {items.length ? (
        <div className="mt-3 space-y-1">
          {items.slice(0, 4).map((item, index) => (
            <div key={`${item.description}-${index}`} className="flex justify-between gap-4">
              <span className="truncate">{item.description}</span>
              <span className={item.type === "expense" ? "text-rose-300" : "text-emerald-300"}>
                <span className="tnum">{formatValue(Math.abs(Number(item.amount)))}</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-[var(--text-dimmed)]">Tidak ada transaksi.</p>
      )}
    </div>
  );
}

function ExpenseBar({
  percent,
  highlight,
}: {
  percent: number;
  highlight: boolean;
}) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const heightClass = useNonceStyle(`height: ${clamped}%;`);

  return (
    <div
      className={[
        "min-h-[12px] w-full rounded-t-lg transition-all duration-500",
        highlight
          ? "bg-primary/30 hover:bg-primary/40 border-t-4 border-primary"
          : "bg-primary/20 hover:bg-primary/30",
        heightClass,
      ].join(" ")}
    />
  );
}

export default function WalletStatCard({ walletName, data }: WalletStatCardProps) {
  const privacyHideAmounts = useAppSettingsStore((state) => state.privacyHideAmounts);
  const currency = useAppSettingsStore((state) => state.currency);
  const numberLocale = useAppSettingsStore((state) => state.numberLocale);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (!privacyHideAmounts) setReveal(false);
  }, [privacyHideAmounts]);

  useEffect(() => {
    if (!reveal) return undefined;
    const timer = window.setTimeout(() => setReveal(false), 4000);
    return () => window.clearTimeout(timer);
  }, [reveal]);

  const formatter = useMemo(() => {
    return new Intl.NumberFormat(numberLocale ?? "id-ID", {
      style: "currency",
      currency: currency ?? "IDR",
      maximumFractionDigits: 0,
    });
  }, [currency, numberLocale]);

  const formatValue = useMemo(() => {
    return (value: number) => {
      const formatted = formatter.format(Number.isFinite(value) ? value : 0);
      if (privacyHideAmounts && !reveal) return maskDigits(formatted);
      return formatted;
    };
  }, [formatter, privacyHideAmounts, reveal]);

  const maxMagnitude = useMemo(() => {
    const values = data.map((item) => {
      const income = Math.abs(Number(item.income ?? 0));
      const expense = Math.abs(Number(item.expense ?? 0));
      return income + expense;
    });
    const max = values.length ? Math.max(...values) : 0;
    return max > 0 ? max : 1;
  }, [data]);

  const maxMagnitudeDay = useMemo(() => {
    let bestDay: string | null = null;
    let bestValue = -1;
    data.forEach((item) => {
      const income = Math.abs(Number(item.income ?? 0));
      const expense = Math.abs(Number(item.expense ?? 0));
      const value = income + expense;
      if (value > bestValue) {
        bestValue = value;
        bestDay = item.day;
      }
    });
    return bestDay;
  }, [data]);

  const isCompact = data.length <= 10;

  return (
    <div className="glass-panel flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--text-dimmed)]">Statistik Dompet</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{walletName}</h3>
        </div>
        {privacyHideAmounts ? (
          <button
            type="button"
            onClick={() => setReveal((current) => !current)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card)]"
            aria-label={reveal ? "Sembunyikan nominal" : "Tampilkan nominal"}
            aria-pressed={reveal}
            title={reveal ? "Sembunyikan nominal" : "Tampilkan nominal"}
          >
            <span className="material-symbols-outlined text-base leading-none">
              {reveal ? "visibility_off" : "visibility"}
            </span>
          </button>
        ) : null}
      </div>
      <div className="no-scrollbar h-[220px] overflow-x-auto pb-2">
        <div className={`flex h-full items-end gap-2 ${isCompact ? "" : "min-w-max"}`}>
          {data.map((item) => {
            const incomeValue = Math.abs(Number(item.income ?? 0));
            const expenseValue = Math.abs(Number(item.expense ?? 0));
            const magnitude = incomeValue + expenseValue;
            const percent = (magnitude / maxMagnitude) * 100;
            const highlight = item.day === maxMagnitudeDay && magnitude > 0;
            return (
              <div
                key={item.day}
                className={`relative group flex h-full flex-col justify-end gap-3 ${isCompact ? "flex-1" : "w-12"}`}
              >
                <div className="relative flex h-[170px] items-end">
                  <div className="absolute -top-12 left-1/2 z-10 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <DayTooltip
                      day={item.day}
                      incomeValue={Number(item.income ?? 0)}
                      expenseValue={Number(item.expense ?? 0)}
                      items={item.items ?? []}
                      formatValue={formatValue}
                    />
                  </div>
                  <ExpenseBar percent={percent} highlight={highlight} />
                </div>
                <div className="flex justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dimmed)]">
                    {item.day}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
