import { NextResponse } from "next/server";
import { handleServiceError } from "@/lib/service-error";
import { getAuthUser } from "@/lib/auth";
import { getProfile, updateProfile } from "@/app/api/profiles/service/profile.service";
import { UpdateProfileSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

export async function GET() {
    try {
        const { user, supabase } = await getAuthUser();
        const profile = await getProfile(supabase, user);
        return NextResponse.json(profile);
    } catch (error) {
        const { body, status } = handleServiceError(error);
        return NextResponse.json(body, { status });
    }
}

export async function PATCH(request: Request) {
    try {
        const { user, supabase } = await getAuthUser();
        const limiter = await rateLimit({
            request,
            key: `profiles:update:${user.id}`,
            limit: 5,
            windowMs: 60_000,
        });
        if (!limiter.ok) {
            return NextResponse.json(
                { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
                { status: 429, headers: withNoStore(limiter.headers) },
            );
        }
        const raw = await request.json();
        const dto = UpdateProfileSchema.parse(raw);
        const profile = await updateProfile(supabase, user, dto);
        return NextResponse.json(profile);
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: (error as import("zod").ZodError).issues.map(i => i.message).join(", ") }, { status: 400 });
        }
        const { body, status } = handleServiceError(error);
        return NextResponse.json(body, { status });
    }
}
