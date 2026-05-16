import type { User } from "@supabase/supabase-js";

const AVATAR_KEYS = [
  "avatar_url",
  "picture",
  "avatar",
  "profile_image_url",
  "image_url",
] as const;

const NAME_KEYS = [
  "full_name",
  "name",
  "display_name",
  "username",
] as const;

type Metadata = Record<string, unknown> | undefined;

function readString(metadata: Metadata, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export function getUserAvatarUrl(user: User | null): string {
  if (!user) return "";
  const metadata = user.user_metadata as Metadata;
  for (const key of AVATAR_KEYS) {
    const value = readString(metadata, key);
    if (value) return value;
  }

  const identities = user.identities ?? [];
  for (const identity of identities) {
    const identityData = identity.identity_data as Metadata;
    for (const key of AVATAR_KEYS) {
      const value = readString(identityData, key);
      if (value) return value;
    }
  }

  return "";
}

export function getUserDisplayName(user: User | null): string {
  if (!user) return "Tamu";
  const metadata = user.user_metadata as Metadata;
  for (const key of NAME_KEYS) {
    const value = readString(metadata, key);
    if (value) return value;
  }
  const email = user.email ?? "";
  if (email) {
    const username = email.split("@")[0];
    if (username) return username;
  }
  return "Pengguna";
}

export function getUserInitials(name?: string, email?: string): string {
  const source = (name ?? "").trim() || (email ?? "").trim() || "BU";
  const parts = source.split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}
