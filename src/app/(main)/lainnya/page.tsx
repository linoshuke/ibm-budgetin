"use client";

import Link from "next/link";
import type { Route } from "next";
import { useI18n } from "@/hooks/useI18n";

export default function MorePage() {
  const { t } = useI18n();

  const links = [
    {
      label: t("nav.appSettings"),
      description: t("settings.subtitle"),
      href: "/pengaturan" as Route,
      icon: "settings",
    },
    {
      label: "Pengaturan Akun",
      description: "Kelola profil, keamanan, dan akun login Anda.",
      href: "/profile" as Route,
      icon: "person",
    },
    {
      label: t("nav.categories"),
      description: "Tambah dan kelola kategori transaksi.",
      href: "/categories" as Route,
      icon: "category",
    },
  ];

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="font-headline text-2xl font-extrabold text-on-surface">{t("nav.more")}</h1>
        <p className="text-sm text-on-surface-variant">{t("nav.quickAccess")}</p>
      </header>

      <div className="grid gap-3">
        {links.map((item) => {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 text-left transition hover:border-outline-variant/20 hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[20px]" data-icon={item.icon}>
                    {item.icon}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-on-surface">{item.label}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-on-surface-variant">{item.description}</p>
                </div>
              </div>
              <span className="material-symbols-outlined shrink-0 text-[20px] text-on-surface-variant" data-icon="chevron_right">
                chevron_right
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
