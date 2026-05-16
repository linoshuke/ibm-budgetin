import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import type { Wallet } from "@/types/wallet";

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  disabled?: boolean;
}

export default function TransactionList({
  transactions,
  categories,
  wallets,
  title = "Transaksi Terakhir",
  subtitle,
  emptyMessage = "Belum ada transaksi. Catat transaksi baru lewat tombol + Catat di dashboard.",
  onEdit,
  onDelete,
  disabled = false,
}: TransactionListProps) {
  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  const walletMap = new Map(wallets.map((item) => [item.id, item]));

  return (
    <section className="glass-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        <span className="text-xs text-[var(--text-dimmed)]">
          {subtitle ?? `${transactions.length} transaksi`}
        </span>
      </div>

      {transactions.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-dimmed)]">{emptyMessage}</p>
      ) : null}

      <div className="mt-4 divide-y divide-[var(--border-soft)]">
        {transactions.map((transaction) => {
          const category = categoryMap.get(transaction.categoryId);
          return (
            <article key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {category?.name ?? "Tanpa kategori"}
                </p>
                <p className="text-xs text-[var(--text-dimmed)]">
                  {formatDate(transaction.date, true)}
                  {` - ${walletMap.get(transaction.walletId)?.name ?? "Tanpa dompet"}`}
                  {transaction.note ? ` - ${transaction.note}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-2 text-sm font-semibold ${transaction.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                  <span>{transaction.type === "income" ? "+" : "-"}</span>
                  <SensitiveCurrency
                    value={Math.abs(transaction.amount)}
                    className={transaction.type === "income" ? "text-emerald-400" : "text-rose-400"}
                    eyeClassName="h-6 w-6 border-transparent bg-transparent hover:bg-[var(--bg-card-muted)]"
                    wrapperClassName="gap-1"
                  />
                </span>

                {onEdit ? (
                  <Button variant="ghost" onClick={() => onEdit(transaction.id)} disabled={disabled}>
                    Edit
                  </Button>
                ) : null}

                {onDelete ? (
                  <Button variant="ghost" className="text-rose-400" onClick={() => onDelete(transaction.id)} disabled={disabled}>
                    Hapus
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
