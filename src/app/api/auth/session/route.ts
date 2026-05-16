import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { withNoStore } from "@/lib/http";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return NextResponse.json({ user: null }, { status: 200, headers: withNoStore() });
    }

    return NextResponse.json(
      { user: data.user ?? null },
      { status: 200, headers: withNoStore() },
    );
  } catch (error) {
    console.error("[Session Error]", error instanceof Error ? error.message : error);
    return NextResponse.json({ user: null }, { status: 200, headers: withNoStore() });
  }
}
