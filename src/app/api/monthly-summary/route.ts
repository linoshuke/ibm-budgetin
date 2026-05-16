import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { handleServiceError } from "@/lib/service-error";

function parseList(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  try {
    const { user, supabase } = await getAuthUser();
    const { searchParams } = new URL(request.url);
    const walletIds = parseList(searchParams.get("walletIds"));
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));

    let query = supabase
      .from("monthly_summary")
      .select("wallet_id, year, month, total_income, total_expense")
      .eq("user_id", user.id);

    if (Number.isFinite(year) && year > 0) {
      query = query.eq("year", year);
    }
    if (Number.isFinite(month) && month > 0) {
      query = query.eq("month", month);
    }
    if (walletIds.length) {
      query = query.in("wallet_id", walletIds);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
