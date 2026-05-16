import { NextResponse } from "next/server";
import { handleServiceError } from "@/lib/service-error";
import { getAuthUser } from "@/lib/auth";
import { updateTransaction, deleteTransaction } from "@/app/api/transactions/service/transaction.service";
import { UpdateTransactionSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { user, supabase } = await getAuthUser();
    const limiter = await rateLimit({
      request,
      key: `transactions:update:${user.id}`,
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
    const raw = await request.json();
    const dto = UpdateTransactionSchema.parse(raw);
    const transaction = await updateTransaction(supabase, user.id, id, dto);
    return NextResponse.json(transaction);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: (error as import("zod").ZodError).issues.map(i => i.message).join(", ") }, { status: 400 });
    }
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { user, supabase } = await getAuthUser();
    const limiter = await rateLimit({
      request: _request,
      key: `transactions:delete:${user.id}`,
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
    await deleteTransaction(supabase, user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
