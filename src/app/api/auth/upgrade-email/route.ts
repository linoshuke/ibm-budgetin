import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";
import { validatePassword } from "@/lib/validators";
import { GENERIC_REQUEST_ERROR } from "@/lib/auth-errors";
import { getRequestOrigin } from "@/lib/request-origin";

function getUpgradeErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("already") && (lower.includes("registered") || lower.includes("exists"))) {
    return "Email sudah digunakan. Pakai email lain atau hubungkan Google.";
  }
  if (lower.includes("identity") && lower.includes("already")) {
    return "Akun dengan email ini sudah terdaftar. Coba login langsung dengan akun tersebut, atau gunakan email berbeda.";
  }
  if (lower.includes("invalid") && lower.includes("email")) {
    return "Format email tidak valid.";
  }
  return "";
}

export async function POST(request: Request) {
  const limiter = await rateLimit({ request, key: "auth:upgrade-email", limit: 3, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const { email, password, name } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    name?: string;
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

  const supabase = await createServerSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json(
      GENERIC_REQUEST_ERROR,
      { status: 401, headers: withNoStore(limiter.headers) },
    );
  }

  if (!userData.user.is_anonymous) {
    return NextResponse.json(
      { error: "Akun Anda sudah permanen." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const origin = getRequestOrigin(request);
  const emailRedirectTo = origin ? `${origin}/auth/callback?next=${encodeURIComponent("/profile")}` : undefined;

  const { error } = await supabase.auth.updateUser(
    {
      email,
      password,
      data: name ? { name } : undefined,
    },
    emailRedirectTo ? { emailRedirectTo } : undefined,
  );

  if (error) {
    const isProd = process.env.NODE_ENV === "production";
    const friendlyMessage = getUpgradeErrorMessage(error.message);
    console.error("Upgrade email failed:", error.message);
    const publicMessage = friendlyMessage || (isProd ? GENERIC_REQUEST_ERROR.error : error.message || GENERIC_REQUEST_ERROR.error);
    return NextResponse.json(
      { error: publicMessage },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
