import type { UserProfile, ThemeMode } from "@/types/profile";

export interface ProfileRow {
    id?: string;
    name: string;
    email: string;
    theme: ThemeMode;
    created_at?: string;
}

export interface UpdateProfileDTO {
    name?: string;
    email?: string;
    theme?: ThemeMode;
}

export function mapRowToProfile(row: ProfileRow): UserProfile {
    return {
        name: row.name,
        email: row.email,
        theme: row.theme,
    };
}

export function mapDTOToUpdateRow(dto: UpdateProfileDTO): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.email !== undefined) row.email = dto.email;
    if (dto.theme !== undefined) row.theme = dto.theme;
    return row;
}
