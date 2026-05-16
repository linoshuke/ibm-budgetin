import { redirect } from "next/navigation";
import type { Route } from "next";

function getFirst(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function sanitizeRedirect(path: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "";
  if (/^\/\\/.test(path)) return "";
  return path;
}

export default function HomePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const errorCode = getFirst(searchParams?.error_code);
  const error = getFirst(searchParams?.error);
  const next = sanitizeRedirect(getFirst(searchParams?.next));

  // Supabase bisa mengirim OAuth error ke Site URL ("/") jika redirectTo tidak dipakai/diizinkan.
  // Intersep di server agar URL error tidak terlihat di production.
  if (errorCode || error) {
    const code = errorCode || error;

    if (code === "identity_already_exists") {
      // Link identity ke user yang sudah ada tidak didukung: arahkan kembali ke profile agar tampil pesan yang ramah.
      redirect("/profile?link_error=identity_already_exists" as Route);
    }

    // Untuk error lain, arahkan ke login agar pesan OAuth bisa ditampilkan.
    const loginUrl = new URL("/login", "http://local");
    loginUrl.searchParams.set("error", code || "oauth_error");
    if (next) loginUrl.searchParams.set("next", next);
    redirect((`${loginUrl.pathname}${loginUrl.search}` as Route));
  }

  redirect("/transactions" as Route);
}
