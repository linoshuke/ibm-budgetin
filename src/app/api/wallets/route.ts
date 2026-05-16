import { NextResponse } from "next/server";
import { handleServiceError, ServiceError } from "@/lib/service-error";
import { getAuthUser } from "@/lib/auth";
import { getAllWallets, createWallet } from "@/app/api/wallets/service/wallet.service";
import { CreateWalletSchema } from "@/lib/validators";
import { assertRegisteredUser } from "@/lib/anonymous";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

const DEFAULT_SYSTEM_WALLETS = [
  { name: "Tunai", category: "Cash", location: "Lokal", is_default: true },
  { name: "GoPay", category: "E-Wallet", location: "Digital", is_default: false },
  { name: "QRIS", category: "E-Wallet", location: "Digital", is_default: false },
] as const;

export async function GET() {
  try {
    const { user, supabase } = await getAuthUser();
    let wallets = await getAllWallets(supabase, user.id);

    if (wallets.length === 0) {
      for (const dto of DEFAULT_SYSTEM_WALLETS) {
        try {
          const { error } = await supabase.from("wallets").insert({
            name: dto.name,
            category: dto.category,
            location: dto.location,
            is_default: dto.is_default,
            user_id: user.id,
          });
          if (error) throw error;
        } catch (error) {
          if (error instanceof ServiceError && error.statusCode === 409) continue;
          console.warn("Gagal membuat dompet default:", error);
        }
      }

      wallets = await getAllWallets(supabase, user.id);
    }
    return NextResponse.json(wallets, {
      headers: {
        ...withNoStore(),
      },
    });
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthUser();
    assertRegisteredUser(user, "Fitur dompet hanya tersedia untuk akun terdaftar.");
    const limiter = await rateLimit({
      request,
      key: `wallets:create:${user.id}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!limiter.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429, headers: withNoStore(limiter.headers) },
      );
    }
    const raw = await request.json();
    const dto = CreateWalletSchema.parse(raw);
    const wallet = await createWallet(supabase, user.id, dto);
    return NextResponse.json(wallet, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: (error as import("zod").ZodError).issues.map(i => i.message).join(", ") }, { status: 400 });
    }
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
