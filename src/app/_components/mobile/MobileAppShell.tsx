"use client";

import MobileBottomNav from "@/app/_components/mobile/MobileBottomNav";
import type { ReactNode } from "react";

export default function MobileAppShell({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
      <MobileBottomNav />
    </div>
  );
}
