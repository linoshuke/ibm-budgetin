"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";

type HeaderTab = {
  key: string;
  label: string;
};

const titles: Array<{ prefix: string; labelKey: string }> = [
  { prefix: "/beranda", labelKey: "nav.dashboard" },
  { prefix: "/riwayat", labelKey: "nav.transactions" },
  { prefix: "/transactions", labelKey: "nav.transactions" },
  { prefix: "/dompet", labelKey: "nav.budgets" },
  { prefix: "/wallets", labelKey: "nav.budgets" },
  { prefix: "/reports", labelKey: "nav.reports" },
  { prefix: "/categories", labelKey: "nav.categories" },
  { prefix: "/profile", labelKey: "nav.account" },
  { prefix: "/pengaturan", labelKey: "nav.appSettings" },
  { prefix: "/lainnya", labelKey: "nav.more" },
  { prefix: "/more", labelKey: "nav.more" },
];

const breadcrumbPages: Array<{ prefix: string; labelKey: string }> = [
  { prefix: "/categories", labelKey: "nav.categories" },
  { prefix: "/profile", labelKey: "nav.account" },
  { prefix: "/reports", labelKey: "nav.reports" },
];

function resolveTitle(pathname: string, t: (key: string) => string) {
  const match = titles.find((item) => pathname.startsWith(item.prefix));
  return match ? t(match.labelKey) : t("app.name");
}

function resolveBreadcrumb(pathname: string, t: (key: string) => string) {
  const match = breadcrumbPages.find((item) => pathname.startsWith(item.prefix));
  if (!match) return null;
  return { parent: t("nav.dashboard"), label: t(match.labelKey) };
}

export default function MainHeader({
  title,
  tabs,
  activeTab,
  onTabChange,
}: {
  title?: string;
  tabs?: HeaderTab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { avatarUrl, initials, displayName, user } = useAuth();
  const resolvedTitle = title ?? resolveTitle(pathname, t);
  const breadcrumb = resolveBreadcrumb(pathname, t);

  const actions = (
    <div className="flex items-center gap-3">
      <button type="button" className="rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container">
        <span className="material-symbols-outlined">notifications</span>
      </button>
      <button
        type="button"
        onClick={() => router.push("/profile")}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container text-[10px] font-semibold text-on-surface transition-colors hover:border-primary/40"
        aria-label={t("aria.openAccountSettings")}
        title={t("aria.accountSettings")}
      >
        {user && avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={displayName} className="h-full w-full object-cover" src={avatarUrl} />
        ) : (
          initials
        )}
      </button>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant/10 bg-surface/80 px-6 py-4 backdrop-blur-xl md:px-8">
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="font-headline text-2xl font-bold tracking-tighter text-primary">{resolvedTitle}</h1>
            {breadcrumb ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                {breadcrumb.parent} / {breadcrumb.label}
              </span>
            ) : null}
          </div>
          <div className="md:hidden">{actions}</div>
        </div>

        {tabs && tabs.length > 0 ? (
          <nav className="flex items-center gap-2 overflow-x-auto pb-1 md:hidden" aria-label={resolvedTitle}>
            {tabs.map((item) => {
              const active = item.key === activeTab;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onTabChange?.(item.key)}
                  aria-pressed={active}
                  className={
                    active
                      ? "shrink-0 rounded-full border border-primary/30 bg-primary/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary"
                      : "shrink-0 rounded-full border border-outline-variant/15 bg-surface-container px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-on-surface"
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        ) : null}

        <div className="hidden items-center gap-6 md:flex">
          {tabs && tabs.length > 0 ? (
            <nav className="flex items-center gap-8 font-headline text-sm font-medium tracking-tight">
              {tabs.map((item) => {
                const active = item.key === activeTab;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onTabChange?.(item.key)}
                    className={
                      active
                        ? "border-b-2 border-primary pb-1 font-bold text-primary"
                        : "font-medium text-on-surface-variant transition-colors hover:text-on-surface"
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          ) : null}
          {actions}
        </div>
      </div>
    </header>
  );
}
