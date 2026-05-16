import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";
import { validatePassword } from "@/lib/validators";
import { GENERIC_REQUEST_ERROR } from "@/lib/auth-errors";

export async function POST(request: Request) {
  const limiter = await rateLimit({ request, key: "auth:password-update", limit: 3, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const supabase = await createServerSupabase();
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };

  if (!password || !validatePassword(password)) {
    return NextResponse.json(
      { error: "Kata sandi minimal 8 karakter dengan huruf besar, huruf kecil, dan angka." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("Password update failed:", error.message);
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
