export default function AddTransactionFab({
  disabled = false,
  onClick,
}: {
  disabled?: boolean;
  onClick?: () => void;
}) {
  if (disabled) {
    return (
      <div
        className="fixed bottom-6 right-6 z-20 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white opacity-60"
        aria-disabled="true"
      >
        <span className="text-base leading-none">+</span>
        Catat
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-20 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-600/30 transition hover:brightness-105"
    >
      <span className="text-base leading-none">+</span>
      Catat
    </button>
  );
}
