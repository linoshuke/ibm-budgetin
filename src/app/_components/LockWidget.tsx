export default function LockWidget() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border-soft)] text-[var(--text-dimmed)]">
        <svg viewBox="0 0 24 24" width={40} height={40} aria-hidden="true">
          <rect
            x="5"
            y="10"
            width="14"
            height="10"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8 10V7.5a4 4 0 0 1 8 0V10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-[var(--text-primary)]">Masuk untuk membuka fitur ini</h2>
      <p className="text-sm text-[var(--text-dimmed)]">
        Silakan login terlebih dahulu agar Anda dapat mengakses data dan fitur yang terkunci.
      </p>
      <a
        href="/login"
        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
      >
        Login Sekarang
      </a>
    </div>
  );
}
