import Link from "next/link";
import { MoreVertical } from "lucide-react";
import Badge from "@/components/ui/Badge";
import DeleteWalletDialog from "@/components/wallets/DeleteWalletDialog";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";
import type { Wallet } from "@/types";

interface WalletCardProps {
  wallet: Wallet;
}

export default function WalletCard({ wallet }: WalletCardProps) {
  return (
    <div className="relative flex h-[200px] flex-col justify-between overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-br from-blue-600/40 via-indigo-600/30 to-slate-900/40 p-5 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/70">{wallet.category}</p>
          <h3 className="text-lg font-semibold text-white">{wallet.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <DeleteWalletDialog walletId={wallet.id} walletName={wallet.name} />
          <button className="text-white/70" aria-label="Menu">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase text-white/70">Saldo</p>
        <p className="text-2xl font-semibold text-white">
          <SensitiveCurrency value={wallet.balance} className="text-white" eyeClassName="h-7 w-7 border-white/20 bg-white/10 hover:bg-white/15" />
        </p>
        {wallet.location ? (
          <div className="mt-3">
            <Badge className="border-white/30 bg-white/15 text-white">{wallet.location}</Badge>
          </div>
        ) : null}
      </div>
      <Link href={`/dompet/${wallet.id}`} className="text-sm font-semibold text-sky-200">
        Lihat detail
      </Link>
    </div>
  );
}
