"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function LockWidget({ message }: { message?: string }) {
  const router = useRouter();

  return (
    <div className="glass-panel flex flex-col items-center gap-4 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-500/15 text-slate-300">
        <Lock size={40} />
      </div>
      <div className="space-y-1">
        <p className="font-display text-lg font-semibold text-[var(--text-primary)]">Akses Terbatas</p>
        <p className="text-sm text-[var(--text-dimmed)]">
          {message ?? "Fitur ini hanya tersedia untuk akun terdaftar."}
        </p>
      </div>
      <Button className="px-6 py-3" onClick={() => router.push("/login")}>
        Masuk untuk lanjut
      </Button>
    </div>
  );
}
