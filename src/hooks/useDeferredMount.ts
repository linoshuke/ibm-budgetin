import { useCallback, useEffect, useRef, useState } from "react";
import { cancelIdle, requestIdle } from "@/lib/idle";

export interface DeferredMountOptions {
  rootMargin?: string;
  threshold?: number | number[];
  idleTimeoutMs?: number;
  minDelayMs?: number;
}

export function useDeferredMount(options: DeferredMountOptions = {}) {
  const {
    rootMargin = "200px",
    threshold = 0.15,
    idleTimeoutMs = 1500,
    minDelayMs = 400,
  } = options;

  const [isInView, setIsInView] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const shouldMount = isInView && isIdle;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (targetRef.current && observerRef.current) {
        observerRef.current.unobserve(targetRef.current);
      }

      targetRef.current = node;

      if (!node || shouldMount) return;

      if (typeof IntersectionObserver === "undefined") {
        setIsInView(true);
        return;
      }

      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry?.isIntersecting) setIsInView(true);
          },
          { root: null, rootMargin, threshold },
        );
      }

      observerRef.current.observe(node);
    },
    [rootMargin, shouldMount, threshold],
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (shouldMount || !isInView) return;

    let idleHandle: number | null = null;
    let delayHandle: number | null = null;

    const schedule = () => {
      idleHandle = requestIdle(() => setIsIdle(true), idleTimeoutMs);
    };

    if (minDelayMs > 0) {
      delayHandle = window.setTimeout(schedule, minDelayMs);
    } else {
      schedule();
    }

    return () => {
      if (delayHandle) window.clearTimeout(delayHandle);
      if (idleHandle) cancelIdle(idleHandle);
    };
  }, [idleTimeoutMs, isInView, minDelayMs, shouldMount]);

  useEffect(() => {
    if (!shouldMount) return;
    if (targetRef.current && observerRef.current) {
      observerRef.current.unobserve(targetRef.current);
    }
  }, [shouldMount]);

  return { ref, shouldMount };
}
