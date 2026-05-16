import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { handleServiceError } from "@/lib/service-error";
import { assertRegisteredUser } from "@/lib/anonymous";
import { CreateGoalSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

export async function GET() {
  try {
    const { user, supabase } = await getAuthUser();
    assertRegisteredUser(user, "Fitur goals hanya tersedia untuk akun terdaftar.");
    const { data, error } = await supabase
      .from("goals")
      .select("id, user_id, name, target_amount, current_amount, target_date, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
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
    assertRegisteredUser(user, "Fitur goals hanya tersedia untuk akun terdaftar.");
    const limiter = await rateLimit({
      request,
      key: `goals:create:${user.id}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!limiter.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429, headers: withNoStore(limiter.headers) },
      );
    }
    const raw = await request.json().catch(() => ({}));
    const dto = CreateGoalSchema.parse(raw);

    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        name: dto.name,
        target_amount: dto.targetAmount,
        current_amount: dto.currentAmount ?? 0,
        target_date: dto.targetDate ?? null,
      })
      .select("id, user_id, name, target_amount, current_amount, target_date, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: (error as import("zod").ZodError).issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
