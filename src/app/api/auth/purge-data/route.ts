import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";
import { GENERIC_REQUEST_ERROR } from "@/lib/auth-errors";

export async function POST(request: Request) {
  const limiter = await rateLimit({ request, key: "auth:purge-data", limit: 2, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const supabase = await createServerSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json(
      GENERIC_REQUEST_ERROR,
      { status: 401, headers: withNoStore(limiter.headers) },
    );
  }

  const userId = userData.user.id;

  try {
    // Delete in FK-safe order.
    const tx = await supabase.from("transactions").delete().eq("user_id", userId);
    if (tx.error) throw tx.error;
    const budgets = await supabase.from("category_budgets").delete().eq("user_id", userId);
    if (budgets.error) throw budgets.error;
    const goals = await supabase.from("goals").delete().eq("user_id", userId);
    if (goals.error) throw goals.error;
    const wallets = await supabase.from("wallets").delete().eq("user_id", userId);
    if (wallets.error) throw wallets.error;
    const categories = await supabase.from("categories").delete().eq("user_id", userId);
    if (categories.error) throw categories.error;
    const profile = await supabase.from("profiles").delete().eq("id", userId);
    if (profile.error) throw profile.error;
  } catch (error) {
    console.error("Purge data failed:", error);
    return NextResponse.json(
      GENERIC_REQUEST_ERROR,
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
