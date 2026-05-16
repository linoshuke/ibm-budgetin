import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";
import { GENERIC_REQUEST_ERROR } from "@/lib/auth-errors";

export async function POST(request: Request) {
  const limiter = await rateLimit({ request, key: "auth:unlink-identity", limit: 5, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const { identityId, provider } = (await request.json().catch(() => ({}))) as {
    identityId?: string;
    provider?: string;
  };

  const supabase = await createServerSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json(
      GENERIC_REQUEST_ERROR,
      { status: 401, headers: withNoStore(limiter.headers) },
    );
  }

  const providers = (userData.user.app_metadata?.providers as string[] | undefined) ?? [];
  const targetProvider = provider?.trim().toLowerCase();
  const identity =
    (identityId
      ? userData.user.identities?.find((item) => item.identity_id === identityId)
      : targetProvider
        ? userData.user.identities?.find((item) => item.provider === targetProvider)
        : undefined) ?? null;

  if (!identity) {
    return NextResponse.json(
      { error: "Identitas tidak ditemukan." },
      { status: 404, headers: withNoStore(limiter.headers) },
    );
  }

  if (identity.provider === "google" && !providers.includes("email")) {
    return NextResponse.json(
      { error: "Tambahkan login email/password sebelum memutuskan Google agar akses tetap aman." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const { error } = await supabase.auth.unlinkIdentity(identity);

  if (error) {
    console.error("Unlink identity failed:", error.message);
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
