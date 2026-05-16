import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";
import { getRequestOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  const limiter = await rateLimit({ request, key: "auth:resend", limit: 3, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan verifikasi. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const supabase = await createServerSupabase();
  const { email } = (await request.json().catch(() => ({}))) as { email?: string };

  if (!email) {
    return NextResponse.json(
      { error: "Email wajib diisi." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const origin = getRequestOrigin(request);
  const emailRedirectTo = origin ? `${origin}/auth/callback` : undefined;
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
  });
  if (error) {
    console.error("Resend email failed:", error.message);
    // Return 200 to avoid user enumeration
    return NextResponse.json(
      { ok: true },
      { status: 200, headers: withNoStore(limiter.headers) },
    );
  }

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
