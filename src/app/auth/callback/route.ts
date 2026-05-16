import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

function sanitizeRedirect(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/beranda";
  if (/^\/\\/.test(path)) return "/beranda";
  return path;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = sanitizeRedirect(url.searchParams.get("next"));
  const isProd = process.env.NODE_ENV === "production";

  // Supabase kadang mengirim error OAuth via query params (bukan hanya hash/fragment)
  // Contoh: error=server_error&error_code=identity_already_exists
  const supabaseError = url.searchParams.get("error");
  const supabaseErrorCode = url.searchParams.get("error_code");
  const supabaseErrorDescription = url.searchParams.get("error_description");

  if (supabaseError || supabaseErrorCode) {
    console.error("Supabase OAuth error in callback:", {
      error: supabaseError,
      error_code: supabaseErrorCode,
      error_description: supabaseErrorDescription,
    });

    // identity_already_exists: akun Google sudah terhubung ke user lain
    // Arahkan kembali ke halaman profil dengan kode error yang tepat
    if (supabaseErrorCode === "identity_already_exists") {
      const profileUrl = new URL("/profile", url.origin);
      profileUrl.searchParams.set("link_error", "identity_already_exists");
      return NextResponse.redirect(profileUrl);
    }

    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", supabaseErrorCode ?? supabaseError ?? "oauth_error");
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "oauth_missing_code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const pkceCookies = request.cookies.getAll().filter((cookie) => cookie.name.includes("-code-verifier"));
    const hasCodeVerifierCookie = pkceCookies.length > 0;

    console.error("OAuth exchange failed:", {
      message: error.message,
      status: (error as { status?: number }).status,
      code: (error as { code?: string }).code,
      hasCodeVerifierCookie,
    });

    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "oauth_exchange_failed");

    const res = NextResponse.redirect(loginUrl);
    // Clear any stale PKCE verifier cookies to make the next login attempt succeed.
    pkceCookies.forEach((cookie) => {
      res.cookies.set(cookie.name, "", { maxAge: 0, path: "/", sameSite: "lax", secure: isProd });
    });
    return res;
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
