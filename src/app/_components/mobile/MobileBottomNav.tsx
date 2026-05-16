"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Route } from "next";

type NavItem = {
  label: string;
  href: Route;
  icon: () => React.ReactElement;
};

const items: NavItem[] = [
  {
    label: "Beranda",
    href: "/",
    icon: () => (
      <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true">
        <path
          d="M3 10.5L12 3l9 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 9.5V21h14V9.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Transaksi",
    href: "/transactions",
    icon: () => (
      <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 7.5v5l3 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Dompet",
    href: "/wallets",
    icon: () => (
      <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true">
        <rect
          x="3.5"
          y="6.5"
          width="17"
          height="11"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M16 10.5h4.5v3H16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Laporan",
    href: "/reports",
    icon: () => (
      <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true">
        <path
          d="M4 19.5h16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <rect x="6" y="10" width="3.5" height="7.5" rx="1" fill="currentColor" />
        <rect x="10.5" y="6.5" width="3.5" height="11" rx="1" fill="currentColor" />
        <rect x="15" y="13" width="3.5" height="4.5" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Lainnya",
    href: "/more",
    icon: () => (
      <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true">
        <circle cx="6" cy="12" r="1.8" fill="currentColor" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" />
        <circle cx="18" cy="12" r="1.8" fill="currentColor" />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-soft)] bg-[var(--bg-nav)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] max-w-lg items-center">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 px-2 py-1 text-[11px] transition-all duration-[250ms] ease-in-out",
                active ? "-translate-y-3 text-indigo-600" : "text-[var(--text-dimmed)]",
              )}
            >
              {item.icon()}
              <span className={active ? "font-bold" : "font-medium"}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
