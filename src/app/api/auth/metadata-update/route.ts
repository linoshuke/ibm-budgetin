import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

export async function POST(request: Request) {
  const limiter = await rateLimit({ request, key: "auth:metadata-update", limit: 5, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: withNoStore(limiter.headers) },
    );
  }

  const { name } = (await request.json().catch(() => ({}))) as { name?: string };

  if (!name) {
    return NextResponse.json(
      { error: "Nama wajib diisi." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      name,
      full_name: name,
    },
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
