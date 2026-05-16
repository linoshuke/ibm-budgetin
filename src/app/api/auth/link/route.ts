import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";
import { GENERIC_REQUEST_ERROR } from "@/lib/auth-errors";

function sanitizeRedirectTo(request: Request, redirectTo?: string) {
  if (!redirectTo) return undefined;
  try {
    const base = new URL(request.url);
    const resolved = new URL(redirectTo, base.origin);
    if (resolved.origin !== base.origin) return undefined;
    return resolved.toString();
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  const limiter = await rateLimit({ request, key: "auth:link-identity", limit: 5, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const { provider, redirectTo } = (await request.json().catch(() => ({}))) as {
    provider?: string;
    redirectTo?: string;
  };

  if (!provider) {
    return NextResponse.json(
      { error: "Provider wajib diisi." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  if (provider !== "google") {
    return NextResponse.json(
      { error: "Provider tidak didukung." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const supabase = await createServerSupabase();
  const safeRedirect = sanitizeRedirectTo(request, redirectTo);
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: {
      redirectTo: safeRedirect,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    console.error("Link identity failed:", error.message);
    return NextResponse.json(
      GENERIC_REQUEST_ERROR,
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  if (!data?.url) {
    return NextResponse.json(
      { error: "Tidak bisa memulai proses link akun." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  return NextResponse.json(
    { url: data.url },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
