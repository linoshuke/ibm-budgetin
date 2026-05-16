import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

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
  const limiter = await rateLimit({ request, key: "auth:password-reset", limit: 3, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan reset. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const supabase = await createServerSupabase();
  const { email, redirectTo } = (await request.json().catch(() => ({}))) as {
    email?: string;
    redirectTo?: string;
  };

  if (!email) {
    return NextResponse.json(
      { error: "Email wajib diisi." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const safeRedirect = sanitizeRedirectTo(request, redirectTo);
  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    safeRedirect ? { redirectTo: safeRedirect } : undefined,
  );
  if (error) {
    console.error("Password reset request failed:", error.message);
  }

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
