import { useEffect, useMemo, useRef, useState } from "react";
import { cancelIdle, requestIdle } from "@/lib/idle";

export interface ProgressiveRenderOptions {
  initial?: number;
  step?: number;
  rootMargin?: string;
  idleTimeoutMs?: number;
  resetKey?: string | number;
}

export function useProgressiveRender<T>(items: T[], options: ProgressiveRenderOptions = {}) {
  const { initial = 40, step = 40, rootMargin = "400px", idleTimeoutMs = 1200, resetKey } = options;

  const [limit, setLimit] = useState(initial);
  const sentinelRef = useRef<HTMLElement | null>(null);

  const total = items.length;
  const canRenderMore = limit < total;

  useEffect(() => {
    setLimit(initial);
  }, [initial, resetKey]);

  useEffect(() => {
    setLimit((current) => {
      if (total === 0) return 0;
      return Math.min(Math.max(current, initial), total);
    });
  }, [initial, total]);

  useEffect(() => {
    if (!canRenderMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;

    let idleHandle: number | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (idleHandle) return;
        idleHandle = requestIdle(() => {
          setLimit((current) => Math.min(current + step, total));
          idleHandle = null;
        }, idleTimeoutMs);
      },
      { root: null, rootMargin, threshold: 0 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (idleHandle) cancelIdle(idleHandle);
    };
  }, [canRenderMore, idleTimeoutMs, limit, rootMargin, step, total]);

  const rendered = useMemo(() => items.slice(0, limit), [items, limit]);

  return { rendered, limit, setLimit, canRenderMore, sentinelRef };
}
