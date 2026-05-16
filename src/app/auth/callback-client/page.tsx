"use client";

import { useEffect } from "react";

function mergeParams(search: URLSearchParams, hash: string) {
  const merged = new URLSearchParams(search);
  const rawHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const hashParams = new URLSearchParams(rawHash);

  hashParams.forEach((value, key) => {
    if (!merged.has(key)) merged.set(key, value);
  });

  return merged;
}

export default function CallbackClientPage() {
  useEffect(() => {
    try {
      const currentUrl = new URL(window.location.href);
      const params = mergeParams(currentUrl.searchParams, currentUrl.hash);

      // Jika tanpa parameter, arahkan user kembali (kemungkinan route dibuka manual).
      if (Array.from(params.keys()).length === 0) {
        window.location.replace("/login");
        return;
      }

      const target = new URL("/auth/callback", currentUrl.origin);
      target.search = params.toString();
      window.location.replace(target.toString());
    } catch (error) {
      console.error("Failed to process auth callback-client:", error);
      window.location.replace("/login?error=oauth_callback_failed");
    }
  }, []);

  return (
    <main className="min-h-[60vh] px-4 py-12">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container p-6 text-center">
        <p className="text-sm font-semibold text-on-surface">Memproses autentikasi…</p>
        <p className="text-sm text-on-surface-variant">
          Jangan tutup halaman ini. Kamu akan diarahkan otomatis.
        </p>
        <a
          href="/login"
          className="mt-2 inline-flex items-center justify-center rounded-lg border border-outline-variant/30 px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
        >
          Kembali ke Login
        </a>
      </div>
    </main>
  );
}
