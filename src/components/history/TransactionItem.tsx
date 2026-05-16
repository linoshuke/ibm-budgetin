import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Transaction } from "@/types";
import { formatFullDateTime } from "@/utils/date";
import { formatSigned } from "@/utils/format";

interface TransactionItemProps {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  const isExpense = transaction.type === "expense";
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[var(--bg-card)] p-4">
      <div className="flex items-center gap-3">
        <div
          className={
            "flex h-10 w-10 items-center justify-center rounded-full " +
            (isExpense ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300")
          }
        >
          {isExpense ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{transaction.description}</p>
          <p className="text-xs text-[var(--text-dimmed)]">{formatFullDateTime(transaction.date)}</p>
        </div>
      </div>
      <p className={isExpense ? "text-rose-300" : "text-emerald-300"}>
        {formatSigned(transaction.amount, transaction.type)}
      </p>
    </div>
  );
}
