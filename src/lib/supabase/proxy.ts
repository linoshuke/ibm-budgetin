import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function refreshSession(request: NextRequest, headersOverride?: Headers) {
  const nextRequest = headersOverride ? { headers: headersOverride } : request;
  let response = NextResponse.next({ request: nextRequest });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request: nextRequest });

        cookiesToSet.forEach(({ name, value, options }) => {
          const nextOptions = { ...(options ?? {}), httpOnly: true };
          response.cookies.set(name, value, nextOptions);
        });
      },
    },
  });

  await supabase.auth.getSession();

  return response;
}
