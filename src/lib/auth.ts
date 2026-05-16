import { createServerSupabase } from "@/lib/supabase-server";
import { ServiceError } from "@/lib/service-error";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface AuthContext {
    user: User;
    supabase: SupabaseClient;
}

export async function getAuthUser(): Promise<AuthContext> {
    const supabase = await createServerSupabase();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        throw new ServiceError("Unauthorized — silakan login terlebih dahulu.", 401);
    }

    return { user, supabase };
}
