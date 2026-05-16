import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";
import { AUTH_ERROR, GENERIC_REQUEST_ERROR } from "@/lib/auth-errors";

export async function POST(request: Request) {
  const limiter = await rateLimit({ request, key: "auth:email-update", limit: 3, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const supabase = await createServerSupabase();
  const { email, currentPassword } = (await request.json().catch(() => ({}))) as {
    email?: string;
    currentPassword?: string;
  };

  if (!email) {
    return NextResponse.json(
      { error: "Email wajib diisi." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user?.email) {
    return NextResponse.json(
      GENERIC_REQUEST_ERROR,
      { status: 401, headers: withNoStore(limiter.headers) },
    );
  }

  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [];
  if (!providers.includes("email")) {
    return NextResponse.json(
      { error: "Perubahan email hanya tersedia untuk akun email/password." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  if (!currentPassword) {
    return NextResponse.json(
      { error: "Masukkan kata sandi saat ini untuk mengganti email." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    return NextResponse.json(
      AUTH_ERROR,
      { status: 401, headers: withNoStore(limiter.headers) },
    );
  }

  const { error } = await supabase.auth.updateUser({ email });
  if (error) {
    return NextResponse.json(
      GENERIC_REQUEST_ERROR,
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
