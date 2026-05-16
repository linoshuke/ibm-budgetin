"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/navigation/BottomNav";
import Sidebar from "@/components/navigation/Sidebar";
import MainHeader from "@/components/navigation/MainHeader";
import { useUIStore } from "@/stores/uiStore";

const tabPaths = ["/beranda", "/transactions", "/dompet", "/reports", "/lainnya"];

function resolveTabIndex(pathname: string) {
  const match = tabPaths.findIndex((path) => pathname.startsWith(path));
  return match === -1 ? 0 : match;
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const isTransactions = pathname.startsWith("/transactions");

  useEffect(() => {
    setActiveTab(resolveTabIndex(pathname));
  }, [pathname, setActiveTab]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const enforceMobileCollapsed = () => {
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        setSidebarCollapsed(true);
      }
    };

    enforceMobileCollapsed();

    window.addEventListener("resize", enforceMobileCollapsed);
    window.addEventListener("orientationchange", enforceMobileCollapsed);
    window.visualViewport?.addEventListener("resize", enforceMobileCollapsed);

    return () => {
      window.removeEventListener("resize", enforceMobileCollapsed);
      window.removeEventListener("orientationchange", enforceMobileCollapsed);
      window.visualViewport?.removeEventListener("resize", enforceMobileCollapsed);
    };
  }, [setSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar />
      <main
        className={`min-h-screen transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {isTransactions ? (
          children
        ) : (
          <>
            <MainHeader />
            <div className="px-6 pb-24 pt-6 lg:pb-12">
              <div className="w-full max-w-none">{children}</div>
            </div>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
