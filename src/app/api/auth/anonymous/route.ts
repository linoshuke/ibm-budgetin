import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";
import { GENERIC_REQUEST_ERROR } from "@/lib/auth-errors";

export async function POST(request: Request) {
  const allowAnonymous = process.env.NEXT_PUBLIC_ALLOW_ANONYMOUS !== "false";
  if (!allowAnonymous) {
    return NextResponse.json(
      { user: null, disabled: true },
      { status: 200, headers: withNoStore() },
    );
  }

  const limiter = await rateLimit({ request, key: "auth:anonymous", limit: 10, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error("Anonymous sign-in failed:", error.message);
    return NextResponse.json(
      GENERIC_REQUEST_ERROR,
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  return NextResponse.json(
    { user: data.user ?? null },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
