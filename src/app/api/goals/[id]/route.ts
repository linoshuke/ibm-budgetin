import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { handleServiceError } from "@/lib/service-error";
import { assertRegisteredUser } from "@/lib/anonymous";
import { UpdateGoalSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { user, supabase } = await getAuthUser();
    assertRegisteredUser(user, "Fitur goals hanya tersedia untuk akun terdaftar.");
    const limiter = await rateLimit({
      request,
      key: `goals:update:${user.id}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!limiter.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429, headers: withNoStore(limiter.headers) },
      );
    }
    const { id } = await context.params;
    const raw = await request.json().catch(() => ({}));
    const dto = UpdateGoalSchema.parse(raw);

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.targetAmount !== undefined) updates.target_amount = dto.targetAmount;
    if (dto.currentAmount !== undefined) updates.current_amount = dto.currentAmount;
    if (dto.targetDate !== undefined) updates.target_date = dto.targetDate;

    const { data, error } = await supabase
      .from("goals")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
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

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { user, supabase } = await getAuthUser();
    assertRegisteredUser(user, "Fitur goals hanya tersedia untuk akun terdaftar.");
    const limiter = await rateLimit({
      request: _request,
      key: `goals:delete:${user.id}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!limiter.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429, headers: withNoStore(limiter.headers) },
      );
    }
    const { id } = await context.params;

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
