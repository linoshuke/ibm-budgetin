import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";
import { AUTH_ERROR } from "@/lib/auth-errors";

export async function POST(request: Request) {
  const { email, password } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const limiter = await rateLimit({
    request,
    key: "auth:login",
    limit: 5,
    windowMs: 60_000,
    extraKeys: email ? [email.trim().toLowerCase()] : undefined,
  });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan login. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const supabase = await createServerSupabase();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan password wajib diisi." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("Login failed:", error.message);
    return NextResponse.json(AUTH_ERROR, { status: 401, headers: withNoStore(limiter.headers) });
  }

  return NextResponse.json(
    { user: data.user ?? null },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
