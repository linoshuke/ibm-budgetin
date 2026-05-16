import { NextResponse } from "next/server";
import { handleServiceError } from "@/lib/service-error";
import { getAuthUser } from "@/lib/auth";
import { getAllCategories, createCategory } from "@/app/api/services/category.service";
import { CreateCategorySchema } from "@/lib/validators";
import { assertRegisteredUser } from "@/lib/anonymous";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

export async function GET() {
    try {
        const { user, supabase } = await getAuthUser();
        const categories = await getAllCategories(supabase, user.id);
        return NextResponse.json(categories, {
            headers: {
                "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
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
        assertRegisteredUser(user, "Fitur kategori hanya tersedia untuk akun terdaftar.");
        const limiter = await rateLimit({
            request,
            key: `categories:create:${user.id}`,
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
        const dto = CreateCategorySchema.parse(raw);
        const category = await createCategory(supabase, user.id, dto);
        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: (error as import("zod").ZodError).issues.map(i => i.message).join(", ") }, { status: 400 });
        }
        const { body, status } = handleServiceError(error);
        return NextResponse.json(body, { status });
    }
}
