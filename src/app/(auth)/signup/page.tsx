"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import WebViewScreen from "@/components/WebViewScreen";
import { useUIStore } from "@/stores/uiStore";
import { getPublicOrigin } from "@/lib/public-url";

const schema = z
  .object({
    username: z.string().min(3, "Username minimal 3 karakter"),
    email: z.string().email(),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak sama",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const pushToast = useUIStore((state) => state.pushToast);
  const [showPassword, setShowPassword] = useState(false);
  const [webview, setWebview] = useState<{ title: string; url: string } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: values.email,
        password: values.password,
        metadata: {
          username: values.username,
          display_name: values.username,
        },
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      pushToast({
        title: "Gagal daftar",
        description: (payload as { error?: string }).error ?? `HTTP ${response.status}`,
        variant: "error",
      });
      return;
    }

    const email = values.email;
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  const handleGoogle = async () => {
    const redirectTo = `${getPublicOrigin()}/auth/callback`;
    const { supabase } = await import("@/lib/supabase/client");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      pushToast({ title: "Gagal daftar Google", description: error.message, variant: "error" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 tablet:px-8">
      <div className="w-full max-w-[520px] rounded-3xl border border-white/10 bg-[var(--bg-card)] p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent-indigo)]/15">
            <UserPlus className="text-[var(--accent-indigo)]" size={64} />
          </div>
          <h1 className="font-display text-2xl font-semibold">Buat Akun Budgetin</h1>
          <p className="text-sm text-[var(--text-dimmed)]">
            Mulai pantau pemasukan & pengeluaran tanpa ribet.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Username</label>
            <Input placeholder="budgetinhero" {...register("username")} />
            {errors.username ? (
              <p className="mt-1 text-xs text-rose-300">{errors.username.message}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Email</label>
            <Input placeholder="nama@email.com" type="email" {...register("email")} />
            {errors.email ? (
              <p className="mt-1 text-xs text-rose-300">{errors.email.message}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Password</label>
            <div className="relative">
              <Input
                placeholder="Minimal 6 karakter"
                type={showPassword ? "text" : "password"}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password ? (
              <p className="mt-1 text-xs text-rose-300">{errors.password.message}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Konfirmasi Password</label>
            <Input placeholder="Ulangi password" type="password" {...register("confirmPassword")} />
            {errors.confirmPassword ? (
              <p className="mt-1 text-xs text-rose-300">{errors.confirmPassword.message}</p>
            ) : null}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Memproses..." : "Daftar"}
          </Button>
          <div className="flex items-center gap-3 text-[11px] text-[var(--text-dimmed)]">
            <span className="h-px flex-1 bg-white/10" />
            ATAU
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            Daftar dengan Google
          </Button>
        </form>

        <div className="mt-4 text-center text-xs text-[var(--text-dimmed)]">
          Sudah punya akun?
          <Link href="/login" className="ml-1 text-[var(--accent-indigo)]">
            Masuk
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-[var(--text-dimmed)]">
          Dengan daftar, Anda menyetujui
          <button
            type="button"
            className="mx-1 font-medium text-[var(--accent-indigo)] underline underline-offset-4 decoration-[var(--accent-indigo)]/50 transition hover:decoration-[var(--accent-indigo)]"
            onClick={() => setWebview({ title: "Syarat & Ketentuan", url: "/terms" })}
          >
            Syarat
          </button>
          dan
          <button
            type="button"
            className="mx-1 font-medium text-[var(--accent-indigo)] underline underline-offset-4 decoration-[var(--accent-indigo)]/50 transition hover:decoration-[var(--accent-indigo)]"
            onClick={() => setWebview({ title: "Kebijakan Privasi", url: "/privacy" })}
          >
            Kebijakan Privasi
          </button>
        </p>
      </div>

      <Dialog open={Boolean(webview)} onOpenChange={() => setWebview(null)}>
        <DialogContent className="max-w-3xl">
          {webview ? <WebViewScreen url={webview.url} title={webview.title} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
