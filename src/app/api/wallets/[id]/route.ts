import { NextResponse, type NextRequest } from "next/server";
import { handleServiceError } from "@/lib/service-error";
import { getAuthUser } from "@/lib/auth";
import { deleteWallet, updateWallet } from "@/app/api/wallets/service/wallet.service";
import { UpdateWalletSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";
import { assertRegisteredUser } from "@/lib/anonymous";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { user, supabase } = await getAuthUser();
    assertRegisteredUser(user, "Fitur dompet hanya tersedia untuk akun terdaftar.");
    const limiter = await rateLimit({
      request,
      key: `wallets:update:${user.id}`,
      limit: 10,
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
    const dto = UpdateWalletSchema.parse(raw);
    const wallet = await updateWallet(supabase, user.id, id, dto);
    return NextResponse.json(wallet);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: (error as import("zod").ZodError).issues.map(i => i.message).join(", ") }, { status: 400 });
    }
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    const { user, supabase } = await getAuthUser();
    assertRegisteredUser(user, "Fitur dompet hanya tersedia untuk akun terdaftar.");
    const limiter = await rateLimit({
      request: _,
      key: `wallets:delete:${user.id}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!limiter.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429, headers: withNoStore(limiter.headers) },
      );
    }
    const { id } = await context.params;
    await deleteWallet(supabase, user.id, id);
    return NextResponse.json({ status: "deleted" }, { status: 200 });
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
