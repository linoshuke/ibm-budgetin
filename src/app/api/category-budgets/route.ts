import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { handleServiceError } from "@/lib/service-error";
import { assertRegisteredUser } from "@/lib/anonymous";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const { user, supabase } = await getAuthUser();
    assertRegisteredUser(user, "Fitur budget hanya tersedia untuk akun terdaftar.");
    const { searchParams } = new URL(request.url);
    const monthKey = searchParams.get("monthKey");
    const history = searchParams.get("history") === "1";

    let query = supabase
      .from("category_budgets")
      .select("id, category_id, month_key, target_amount, created_at")
      .eq("user_id", user.id)
      .order("month_key", { ascending: false });

    if (!history) {
      if (!monthKey) {
        return NextResponse.json({ error: "monthKey wajib diisi." }, { status: 400 });
      }
      query = query.eq("month_key", monthKey);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthUser();
    assertRegisteredUser(user, "Fitur budget hanya tersedia untuk akun terdaftar.");
    const limiter = await rateLimit({
      request,
      key: `category-budgets:upsert:${user.id}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!limiter.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429, headers: withNoStore(limiter.headers) },
      );
    }
    const raw = (await request.json().catch(() => ({}))) as {
      entries?: Array<{ categoryId: string; monthKey: string; targetAmount: number }>;
      categoryId?: string;
      monthKey?: string;
      targetAmount?: number;
    };

    const entries = Array.isArray(raw.entries)
      ? raw.entries
      : raw.categoryId && raw.monthKey && raw.targetAmount !== undefined
        ? [
            {
              categoryId: raw.categoryId,
              monthKey: raw.monthKey,
              targetAmount: raw.targetAmount,
            },
          ]
        : [];

    if (entries.length === 0) {
      return NextResponse.json({ error: "Tidak ada data target." }, { status: 400 });
    }

    const upserts = entries.map((entry) => ({
      user_id: user.id,
      category_id: entry.categoryId,
      month_key: entry.monthKey,
      target_amount: entry.targetAmount,
    }));

    const { error } = await supabase
      .from("category_budgets")
      .upsert(upserts, { onConflict: "user_id,category_id,month_key" });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, supabase } = await getAuthUser();
    assertRegisteredUser(user, "Fitur budget hanya tersedia untuk akun terdaftar.");
    const limiter = await rateLimit({
      request,
      key: `category-budgets:delete:${user.id}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!limiter.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429, headers: withNoStore(limiter.headers) },
      );
    }
    const { searchParams } = new URL(request.url);
    const monthKey = searchParams.get("monthKey");

    if (monthKey) {
      const { error } = await supabase
        .from("category_budgets")
        .delete()
        .eq("user_id", user.id)
        .eq("month_key", monthKey);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    const raw = (await request.json().catch(() => ({}))) as { ids?: string[] };
    if (!raw.ids || raw.ids.length === 0) {
      return NextResponse.json({ error: "Ids wajib diisi." }, { status: 400 });
    }

    const { error } = await supabase
      .from("category_budgets")
      .delete()
      .eq("user_id", user.id)
      .in("id", raw.ids);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
