import { refreshSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/register", "/signup", "/verify-email"];

function createNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function buildCsp(nonce: string) {
  const isDev = process.env.NODE_ENV !== "production";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let supabaseHost = "";
  try {
    supabaseHost = supabaseUrl ? new URL(supabaseUrl).origin : "";
  } catch {
    supabaseHost = "";
  }

  const styleSrc = [
    "'self'",
    "https://fonts.googleapis.com",
    isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`,
  ].join(" ");

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    !isDev ? "https://va.vercel-scripts.com" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `style-src ${styleSrc}`,
    "style-src-attr 'unsafe-inline'",
    `script-src ${scriptSrc}`,
    `script-src-elem ${scriptSrc}`,
    `connect-src 'self' ${supabaseHost || "https://*.supabase.co"} https: wss:`,
    "frame-src 'self' https:",
    "media-src 'self' https:",
  ]
    .filter(Boolean)
    .join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = createNonce();
  const csp = buildCsp(nonce);
  const cspHeaderName = process.env.CSP_REPORT_ONLY === "true"
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("content-security-policy", csp);
  requestHeaders.set("x-csp-nonce", nonce);

  const response = await refreshSession(request, requestHeaders);
  response.headers.set(cspHeaderName, csp);
  response.headers.set("x-csp-nonce", nonce);

  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
