import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  sizeClassName?: string;
}

export default function Modal({
  open,
  title,
  onClose,
  children,
  sizeClassName = "max-w-3xl",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/40"
        aria-label="Tutup pop up"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${sizeClassName} rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5 shadow-2xl`}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          {title ? (
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          ) : null}
          <button
            type="button"
            className="rounded-lg border border-[var(--border-soft)] px-3 py-1 text-xs text-[var(--text-dimmed)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
