"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useI18n } from "@/hooks/useI18n";

const navItems = [
  { labelKey: "nav.dashboard", href: "/beranda", icon: "dashboard" },
  { labelKey: "nav.transactions", href: "/transactions", icon: "receipt_long" },
  { labelKey: "nav.budgets", href: "/dompet", icon: "account_balance_wallet" },
  { labelKey: "nav.reports", href: "/reports", icon: "bar_chart" },
  { labelKey: "nav.more", href: "/lainnya", icon: "more_horiz" },
];

export default function BottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const openModal = useUIStore((state) => state.openModal);

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/10 bg-surface pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
      <div className="relative mx-auto flex h-[68px] max-w-2xl items-stretch px-3">
        <div className="flex flex-1 items-stretch justify-start gap-1 pr-10">
          {leftItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2",
                  active ? "text-primary" : "text-on-surface-variant",
                )}
              >
                <span className="material-symbols-outlined text-[22px]" data-icon={item.icon}>
                  {item.icon}
                </span>
                <span className="max-w-full truncate text-[10px] font-bold">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-1 items-stretch justify-end gap-1 pl-10">
          {rightItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2",
                  active ? "text-primary" : "text-on-surface-variant",
                )}
              >
                <span className="material-symbols-outlined text-[22px]" data-icon={item.icon}>
                  {item.icon}
                </span>
                <span className="max-w-full truncate text-[10px] font-medium">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => openModal("quickAddTransaction")}
          className="absolute left-1/2 top-1/2 inline-flex h-full w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          aria-label={t("aria.addTransaction")}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary-container shadow-lg shadow-primary/20 ring-1 ring-outline-variant/15 transition-transform active:scale-95">
            <span className="material-symbols-outlined text-[28px] leading-none text-on-primary" data-icon="add">
              add
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
}
