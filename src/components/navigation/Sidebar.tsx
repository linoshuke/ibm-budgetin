"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useI18n } from "@/hooks/useI18n";

const navItems = [
  { labelKey: "nav.dashboard", href: "/beranda", icon: "dashboard" },
  { labelKey: "nav.transactions", href: "/transactions", icon: "receipt_long" },
  { labelKey: "nav.budgets", href: "/dompet", icon: "account_balance_wallet" },
  { labelKey: "nav.reports", href: "/statistik", icon: "bar_chart" },
  { labelKey: "nav.appSettings", href: "/pengaturan", icon: "settings" },
];

const quickItems = [
  { labelKey: "nav.categories", href: "/categories", icon: "category" },
  { labelKey: "nav.account", href: "/profile", icon: "person" },
];

const SIDEBAR_STORAGE_KEY = "budgetin:sidebar";

function isActiveHref(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const openModal = useUIStore((state) => state.openModal);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const media = window.matchMedia("(min-width: 1024px)");

    const sync = () => {
      if (!media.matches) {
        setSidebarCollapsed(true);
        return;
      }

      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === "collapsed") setSidebarCollapsed(true);
      if (stored === "expanded") setSidebarCollapsed(false);
    };

    sync();

    const legacy = media as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }

    legacy.addListener?.(sync);
    return () => legacy.removeListener?.(sync);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarCollapsed ? "collapsed" : "expanded");
  }, [sidebarCollapsed]);

  return (
    <>
      {/* Mobile Backdrop */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-surface/80 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto border-r border-outline-variant/10 bg-surface transition-all duration-300 ease-in-out lg:z-40",
          sidebarCollapsed ? "-translate-x-full lg:w-20 lg:translate-x-0 lg:p-4" : "translate-x-0 p-6 shadow-2xl lg:shadow-none",
        )}
      >
      <div>
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary-container">
            <span className="material-symbols-outlined text-on-primary">account_balance_wallet</span>
          </div>
          {sidebarCollapsed ? null : (
            <div>
              <div className="font-headline text-xl font-black text-primary">{t("app.name")}</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant/60">
                {t("app.tagline")}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/20 text-on-surface-variant transition-colors hover:text-primary"
            aria-label={sidebarCollapsed ? t("aria.expandSidebar") : t("aria.collapseSidebar")}
          >
            <span className="material-symbols-outlined text-base">
              {sidebarCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = isActiveHref(pathname, item.href);
            const label = t(item.labelKey);
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center rounded-lg p-3 text-base font-medium transition-all",
                  sidebarCollapsed ? "justify-center" : "space-x-3",
                  active
                    ? "bg-gradient-to-r from-primary/25 via-primary/10 to-transparent font-bold text-on-surface ring-1 ring-inset ring-primary/30 shadow-sm shadow-primary/10 before:absolute before:left-0 before:top-1/2 before:h-9 before:w-1.5 before:-translate-y-1/2 before:rounded-r-full before:bg-primary before:content-['']"
                    : "text-on-surface-variant hover:translate-x-1 hover:bg-surface-container hover:text-on-surface",
                )}
                title={sidebarCollapsed ? label : undefined}
              >
                <span className="material-symbols-outlined" data-icon={item.icon}>
                  {item.icon}
                </span>
                <span className={sidebarCollapsed ? "sr-only" : undefined}>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 space-y-2">
          {sidebarCollapsed ? null : (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/60">
              {t("nav.quickAccess")}
            </p>
          )}
          <nav className="space-y-2">
            {quickItems.map((item) => {
              const active = isActiveHref(pathname, item.href);
              const label = t(item.labelKey);
              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center rounded-lg p-3 text-sm font-medium transition-all",
                    sidebarCollapsed ? "justify-center" : "space-x-3",
                    active
                      ? "bg-gradient-to-r from-primary/25 via-primary/10 to-transparent font-bold text-on-surface ring-1 ring-inset ring-primary/30 shadow-sm shadow-primary/10 before:absolute before:left-0 before:top-1/2 before:h-9 before:w-1.5 before:-translate-y-1/2 before:rounded-r-full before:bg-primary before:content-['']"
                      : "text-on-surface-variant hover:translate-x-1 hover:bg-surface-container hover:text-on-surface",
                  )}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <span className="material-symbols-outlined text-base" data-icon={item.icon}>
                    {item.icon}
                  </span>
                  <span className={sidebarCollapsed ? "sr-only" : undefined}>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="mt-auto">
        <button
          type="button"
          onClick={() => openModal("quickAddTransaction")}
          className={cn(
            "flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary-container px-4 py-4 text-sm font-bold text-on-primary shadow-xl shadow-primary/10 transition-transform active:scale-95",
            sidebarCollapsed ? "space-x-0" : "space-x-2",
          )}
        >
          <span className="material-symbols-outlined text-3xl" data-icon="add_circle">
            add_circle
          </span>
          <span className={sidebarCollapsed ? "sr-only" : undefined}>{t("nav.addTransaction")}</span>
        </button>
      </div>
    </aside>
    </>
  );
}
