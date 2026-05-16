import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { withNoStore } from "@/lib/http";

export async function POST() {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: withNoStore() },
    );
  }

  let anonymous = false;

  const { data, error: anonymousError } = await supabase.auth.signInAnonymously();
  if (anonymousError) {
    console.error("Failed to create anonymous session after logout:", anonymousError.message);
  } else {
    anonymous = Boolean(data.user);
  }

  const res = NextResponse.json({ ok: true, anonymous }, { status: 200, headers: withNoStore() });
  return res;
}
