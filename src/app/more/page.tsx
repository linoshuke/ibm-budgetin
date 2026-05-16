"use client";

import Header from "@/components/layout/Header";
import MobileAppBar from "@/app/_components/mobile/MobileAppBar";
import MobileBottomNav from "@/app/_components/mobile/MobileBottomNav";
import AuthGate from "@/components/shared/AuthGate";
import Link from "next/link";
import type { Route } from "next";

const moreLinks = [
  {
    label: "Pengaturan Aplikasi",
    href: "/pengaturan",
    description: "Bahasa, mata uang, privasi, dan preferensi aplikasi.",
    icon: "settings",
  },
  {
    label: "Pengaturan Akun",
    href: "/profile",
    description: "Kelola akun, keamanan, password, dan ekspor data.",
    icon: "person",
  },
  {
    label: "Kategori",
    href: "/categories",
    description: "Tambah dan kelola kategori transaksi.",
    icon: "category",
  },
] satisfies Array<{ label: string; href: Route; description: string; icon: string }>;

export default function MorePage() {
  return (
    <AuthGate>
      <div className="min-h-screen">
        <div className="hidden md:block">
          <Header />
        </div>
        <div className="md:hidden">
          <MobileAppBar title="Lainnya" />
        </div>

        <main className="page-shell space-y-4">
          <section className="space-y-2 md:space-y-1">
            <h1 className="text-xl font-semibold text-[var(--text-primary)] md:text-2xl">Lainnya</h1>
            <p className="text-sm text-[var(--text-dimmed)]">
              Akses cepat ke pengaturan aplikasi, akun, dan kategori.
            </p>
          </section>

          <section className="grid gap-3">
            {moreLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="glass-panel group flex items-center gap-4 p-4 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-muted)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-strong)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-muted)] text-[var(--text-primary)]">
                  <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)] md:text-base">
                    {item.label}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-dimmed)] md:text-sm">
                    {item.description}
                  </p>
                </div>
                <span className="material-symbols-outlined text-[18px] text-[var(--text-dimmed)] transition group-hover:text-[var(--text-primary)]">
                  chevron_right
                </span>
              </Link>
            ))}
          </section>
        </main>

        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      </div>
    </AuthGate>
  );
}
