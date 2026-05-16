import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";
import { validatePassword } from "@/lib/validators";
import { GENERIC_REQUEST_ERROR } from "@/lib/auth-errors";
import { getRequestOrigin } from "@/lib/request-origin";

function getSupabaseRegisterErrorMessage(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("redirect") && (lower.includes("not allowed") || lower.includes("invalid"))) {
    return "Redirect URL Supabase belum diizinkan. Tambahkan `http://localhost:3000/auth/callback` (dev) dan domain produksi `/auth/callback` ke Supabase → Authentication → URL Configuration → Redirect URLs.";
  }

  if (lower.includes("signup") && lower.includes("disabled")) {
    return "Pendaftaran email sedang dimatikan di Supabase. Aktifkan di Supabase → Authentication → Providers → Email.";
  }

  if (lower.includes("rate limit") && lower.includes("email")) {
    return "Terlalu banyak email verifikasi dikirim. Coba lagi beberapa menit.";
  }

  if (lower.includes("already") && (lower.includes("registered") || lower.includes("exists"))) {
    return "Email sudah terdaftar. Silakan login atau gunakan fitur lupa password.";
  }

  return "";
}

export async function POST(request: Request) {
  const limiter = await rateLimit({ request, key: "auth:register", limit: 3, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan pendaftaran. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const supabase = await createServerSupabase();
  const { email, password, metadata } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    metadata?: Record<string, string>;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan password wajib diisi." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  if (!validatePassword(password)) {
    return NextResponse.json(
      { error: "Kata sandi minimal 8 karakter dengan huruf besar, huruf kecil, dan angka." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const origin = getRequestOrigin(request);
  const emailRedirectTo = origin ? `${origin}/auth/callback` : undefined;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      ...(metadata ? { data: metadata } : {}),
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
    },
  });

  if (error) {
    const isProd = process.env.NODE_ENV === "production";
    const friendlyMessage = getSupabaseRegisterErrorMessage(error.message);
    console.error("Register failed:", error.message);

    return NextResponse.json(
      isProd
        ? GENERIC_REQUEST_ERROR
        : {
            error: friendlyMessage || error.message || GENERIC_REQUEST_ERROR.error,
            debug: {
              supabase_message: error.message,
              status: (error as { status?: number }).status ?? undefined,
              code: (error as { code?: string }).code ?? undefined,
              emailRedirectTo,
            },
          },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  return NextResponse.json(
    { user: data.user ?? null },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
