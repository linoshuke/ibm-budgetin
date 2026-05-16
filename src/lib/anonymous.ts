import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ServiceError, mapDbError } from "@/lib/service-error";

export const ANON_LIMITS = {
  wallets: 2,
  transactions: 50,
};

export function assertRegisteredUser(user: User, message: string) {
  if (user.is_anonymous) {
    throw new ServiceError(message, 403);
  }
}

export async function enforceAnonCountLimit(options: {
  supabase: SupabaseClient;
  user: User;
  table: "wallets" | "transactions";
  limit: number;
  message: string;
}) {
  const { supabase, user, table, limit, message } = options;
  if (!user.is_anonymous) return;

  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) {
    throw mapDbError(error);
  }

  if ((count ?? 0) >= limit) {
    throw new ServiceError(message, 403);
  }
}
