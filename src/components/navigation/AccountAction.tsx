"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AccountAction() {
  const router = useRouter();
  const { user, displayName, avatarUrl, initials } = useAuth();

  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        aria-label="Masuk"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[var(--bg-card)] text-[var(--text-primary)] transition hover:border-white/20"
      >
        <LogIn size={22} />
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push("/profile")}
      aria-label="Buka akun"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-primary)] transition hover:border-white/20"
      title={displayName}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={displayName} className="h-9 w-9 rounded-full object-cover" />
      ) : (
        initials
      )}
    </button>
  );
}
