import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import TransactionItem from "@/components/history/TransactionItem";
import type { Transaction } from "@/types";

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

export default function TransactionList({ transactions, loading, error, onRetry }: TransactionListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-[var(--text-dimmed)]">
        <p>Gagal memuat transaksi.</p>
        {onRetry ? (
          <Button variant="outline" className="mt-3" onClick={onRetry}>
            Coba Lagi
          </Button>
        ) : null}
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-[var(--text-dimmed)]">
        Belum ada transaksi untuk periode ini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}
