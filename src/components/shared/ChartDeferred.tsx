"use client";

import type { ReactNode } from "react";
import { useDeferredMount, type DeferredMountOptions } from "@/hooks/useDeferredMount";

interface ChartDeferredProps extends DeferredMountOptions {
  children: ReactNode;
  fallback: ReactNode;
  className?: string;
}

export default function ChartDeferred({ children, fallback, className, ...options }: ChartDeferredProps) {
  const { ref, shouldMount } = useDeferredMount(options);

  return (
    <div ref={ref} className={className}>
      {shouldMount ? children : fallback}
    </div>
  );
}

