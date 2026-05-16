import Modal from "@/components/shared/Modal";
import type { Wallet } from "@/types/wallet";

interface WalletFilterModalProps {
  open: boolean;
  wallets: Wallet[];
  draftWalletIds: string[];
  title?: string;
  description?: string;
  onToggle: (id: string) => void;
  onApply: () => void;
  onClose: () => void;
}

export default function WalletFilterModal({
  open,
  wallets,
  draftWalletIds,
  title = "Filter Dompet",
  description = "Pilih satu atau lebih dompet untuk memfilter data dashboard.",
  onToggle,
  onApply,
  onClose,
}: WalletFilterModalProps) {
  return (
    <Modal open={open} title={title} onClose={onClose} sizeClassName="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-dimmed)]">{description}</p>
        <div className="space-y-2">
          {wallets.map((wallet) => (
            <label key={wallet.id} className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-indigo-600"
                checked={draftWalletIds.includes(wallet.id)}
                onChange={() => onToggle(wallet.id)}
              />
              {wallet.name}
            </label>
          ))}
          {wallets.length === 0 ? (
            <p className="text-sm text-[var(--text-dimmed)]">Belum ada dompet yang tersimpan.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={onApply}
          >
            Terapkan
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-dimmed)]"
            onClick={onClose}
          >
            Batal
          </button>
        </div>
      </div>
    </Modal>
  );
}
