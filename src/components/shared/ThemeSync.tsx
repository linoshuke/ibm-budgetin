"use client";

import { useBudgetStore } from "@/store/budgetStore";
import { useEffect } from "react";

export default function ThemeSync() {
  const theme = useBudgetStore((state) => state.profile.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
}
