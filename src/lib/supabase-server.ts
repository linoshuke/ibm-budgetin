import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

type NextCookieOptions = Partial<ResponseCookie>;

export async function createServerSupabase() {
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            const isPkceVerifierCookie = name.includes("-code-verifier");
                            const nextOptions: NextCookieOptions = {
                                ...((options ?? {}) as NextCookieOptions),
                                // PKCE verifier cookies are written by the browser client during OAuth.
                                // If we mark them as httpOnly here, the browser cannot overwrite them,
                                // leading to "code challenge does not match previously saved code verifier".
                                httpOnly: isPkceVerifierCookie ? false : true,
                                sameSite: "lax",
                                secure: isProd,
                            };
                            cookieStore.set(name, value, nextOptions);
                        });
                    } catch {
                        // setAll called from Server Component where cookies are read-only
                    }
                },
            },
        },
    );
}
