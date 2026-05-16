"use client";

import { useMemo, useState } from "react";

interface WebViewScreenProps {
  url: string;
  title?: string;
}

const DEFAULT_ALLOWED_HOSTS = new Set([
  "example.com",
]);

function resolveAllowedHosts() {
  const env = process.env.NEXT_PUBLIC_ALLOWED_IFRAME_HOSTS ?? "";
  const fromEnv = env
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_HOSTS, ...fromEnv]);
}

export default function WebViewScreen({ url, title }: WebViewScreenProps) {
  const [loading, setLoading] = useState(true);
  const allowedHosts = useMemo(() => resolveAllowedHosts(), []);

  const { isAllowed, resolvedUrl } = useMemo(() => {
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "https://example.com";
      const resolved = new URL(url, base);
      const sameOrigin = typeof window !== "undefined" && resolved.origin === window.location.origin;
      const allowed =
        sameOrigin || (allowedHosts.has(resolved.hostname) && resolved.protocol === "https:");
      return { isAllowed: allowed, resolvedUrl: resolved.toString() };
    } catch {
      return { isAllowed: false, resolvedUrl: url };
    }
  }, [allowedHosts, url]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--bg-card)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm">
        <span className="font-medium text-[var(--text-primary)]">{title ?? "Web"}</span>
        <a href={resolvedUrl} target="_blank" rel="noreferrer" className="text-[var(--accent-indigo)]">
          Buka tab baru
        </a>
      </div>
      <div className={"h-1 w-full " + (isAllowed && loading ? "bg-[var(--accent-indigo)]/50" : "bg-transparent")}>
        {isAllowed && loading ? <div className="h-1 w-1/3 animate-pulse bg-[var(--accent-indigo)]" /> : null}
      </div>
      {isAllowed ? (
        <iframe
          src={resolvedUrl}
          className="h-[60vh] w-full rounded-b-2xl"
          onLoad={() => setLoading(false)}
          title={title ?? "WebView"}
          sandbox="allow-scripts allow-forms allow-popups"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-[60vh] w-full items-center justify-center px-6 text-center text-sm text-[var(--text-dimmed)]">
          URL tidak diizinkan untuk ditampilkan di dalam aplikasi. Silakan buka di tab baru.
        </div>
      )}
    </div>
  );
}
