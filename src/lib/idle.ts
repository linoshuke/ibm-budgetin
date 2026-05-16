"use client";

type IdleDeadlineLike = { didTimeout: boolean; timeRemaining: () => number };

export function requestIdle(callback: (deadline: IdleDeadlineLike) => void, timeoutMs: number) {
  const win = window as unknown as {
    requestIdleCallback?: (cb: (deadline: IdleDeadlineLike) => void, options?: { timeout: number }) => number;
  };

  if (typeof win.requestIdleCallback === "function") {
    return win.requestIdleCallback(callback, { timeout: timeoutMs });
  }

  return window.setTimeout(() => callback({ didTimeout: true, timeRemaining: () => 0 }), Math.min(timeoutMs, 200));
}

export function cancelIdle(handle: number) {
  const win = window as unknown as {
    cancelIdleCallback?: (id: number) => void;
  };

  if (typeof win.cancelIdleCallback === "function") {
    win.cancelIdleCallback(handle);
    return;
  }

  window.clearTimeout(handle);
}
