import type { SupabaseClient } from "@supabase/supabase-js";
import type { Wallet } from "@/types/wallet";
import {
    type CreateWalletDTO,
    type UpdateWalletDTO,
    mapRowToWallet,
    mapRowsToWallets,
    mapDTOToInsertRow,
} from "@/app/api/wallets/models/wallet.model";
import { ServiceError, mapDbError } from "@/lib/service-error";

export async function getAllWallets(
    supabase: SupabaseClient,
    userId: string,
): Promise<Wallet[]> {
    const { data, error } = await supabase
        .from("wallets")
        .select("id, name, category, location, balance, is_default")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

    if (error) {
        throw mapDbError(error);
    }

    return mapRowsToWallets(data ?? []);
}

export async function getWalletById(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<Wallet> {
    const { data, error } = await supabase
        .from("wallets")
        .select("id, name, category, location, balance, is_default")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

    if (error) {
        const notFound = error.code === "PGRST116";
        if (notFound) {
            throw new ServiceError("Dompet tidak ditemukan.", 404);
        }
        throw mapDbError(error);
    }

    return mapRowToWallet(data);
}

export async function createWallet(
    supabase: SupabaseClient,
    userId: string,
    dto: CreateWalletDTO,
): Promise<Wallet> {
    const name = dto.name?.trim();
    const category = dto.category?.trim();
    const location = dto.location?.trim();
    if (!name) {
        throw new ServiceError("Nama dompet wajib diisi.", 400);
    }
    if (!category) {
        throw new ServiceError("Kategori dompet wajib diisi.", 400);
    }
    if (!location) {
        throw new ServiceError("Lokasi dompet wajib diisi.", 400);
    }

    const insertRow = {
        ...mapDTOToInsertRow({ name, category, location }),
        user_id: userId,
    };

    const { data, error } = await supabase
        .from("wallets")
        .insert(insertRow)
        .select("id, name, category, location, balance, is_default")
        .single();

    if (error) {
        if (error.code === "23505") {
            throw new ServiceError("Nama dompet sudah digunakan.", 409);
        }
        throw mapDbError(error);
    }

    return mapRowToWallet(data);
}

export async function updateWallet(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    dto: UpdateWalletDTO,
): Promise<Wallet> {
    const name = dto.name?.trim();
    if (!name) {
        throw new ServiceError("Nama dompet wajib diisi.", 400);
    }

    const updates: { name: string; category?: string; location?: string } = { name };
    if (dto.category !== undefined) {
        const category = dto.category.trim();
        if (!category) {
            throw new ServiceError("Kategori dompet wajib diisi.", 400);
        }
        updates.category = category;
    }
    if (dto.location !== undefined) {
        const location = dto.location.trim();
        if (!location) {
            throw new ServiceError("Lokasi dompet wajib diisi.", 400);
        }
        updates.location = location;
    }

    const { data, error } = await supabase
        .from("wallets")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select("id, name, category, location, balance, is_default")
        .single();

    if (error) {
        if (error.code === "23505") {
            throw new ServiceError("Nama dompet sudah digunakan.", 409);
        }
        const notFound = error.code === "PGRST116";
        if (notFound) {
            throw new ServiceError("Dompet tidak ditemukan.", 404);
        }
        throw mapDbError(error);
    }

    if (!data) {
        throw new ServiceError("Dompet tidak ditemukan.", 404);
    }

    return mapRowToWallet(data);
}

export async function deleteWallet(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<void> {
    const existing = await getWalletById(supabase, userId, id);
    if (existing.isDefault) {
        throw new ServiceError("Dompet default tidak dapat dihapus.", 400);
    }

    const { error } = await supabase
        .from("wallets")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) {
        throw mapDbError(error);
    }
}
