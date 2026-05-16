import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/profile";
import {
    type UpdateProfileDTO,
    mapRowToProfile,
    mapDTOToUpdateRow,
} from "@/app/api/profiles/models/profile.model";
import { mapDbError } from "@/lib/service-error";

export async function getProfile(
    supabase: SupabaseClient,
    user: User,
): Promise<UserProfile> {
    const { data, error } = await supabase
        .from("profiles")
        .select("name, email, theme")
        .eq("id", user.id)
        .single();

    if (error) {
        const notFound = error.code === "PGRST116";
        if (notFound) {
            const displayName =
                (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
                (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
                (user.email ? user.email.split("@")[0] : "Pengguna");

            const { data: created, error: insertError } = await supabase
                .from("profiles")
                .upsert(
                    {
                        id: user.id,
                        name: displayName || "Pengguna",
                        email: user.email ?? "",
                        theme: "dark",
                    },
                    { onConflict: "id" },
                )
                .select("name, email, theme")
                .single();

            if (insertError) {
                throw mapDbError(insertError);
            }

            return mapRowToProfile(created);
        }
        throw mapDbError(error);
    }

    return mapRowToProfile(data);
}

export async function updateProfile(
    supabase: SupabaseClient,
    user: User,
    dto: UpdateProfileDTO,
): Promise<UserProfile> {
    const updateRow = mapDTOToUpdateRow(dto);

    if (Object.keys(updateRow).length === 0) {
        return getProfile(supabase, user);
    }

    await getProfile(supabase, user);

    const { data, error } = await supabase
        .from("profiles")
        .update(updateRow)
        .eq("id", user.id)
        .select("name, email, theme")
        .single();

    if (error) {
        throw mapDbError(error);
    }

    return mapRowToProfile(data);
}
