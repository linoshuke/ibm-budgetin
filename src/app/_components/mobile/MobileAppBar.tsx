import AccountEntry from "@/app/_components/AccountEntry";

export default function MobileAppBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-soft)] bg-[var(--bg-nav)]/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-base font-semibold text-[var(--text-primary)]">{title}</h1>
        <AccountEntry />
      </div>
    </header>
  );
}
