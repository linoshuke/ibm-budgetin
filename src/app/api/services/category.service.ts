import type { SupabaseClient } from "@supabase/supabase-js";
import { ServiceError, mapDbError } from "@/lib/service-error";
import type { Category } from "@/types/category";
import {
    type CreateCategoryDTO,
    mapRowToCategory,
    mapRowsToCategories,
    mapDTOToInsertRow,
} from "@/app/api/categories/models/category.model";

export async function getAllCategories(
    supabase: SupabaseClient,
    userId: string,
): Promise<Category[]> {
    const { data, error } = await supabase
        .from("categories")
        .select("id, user_id, name, icon, color, type, is_default, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

    if (error) {
        throw mapDbError(error);
    }

    return mapRowsToCategories(data ?? []);
}

export async function getCategoryById(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<Category> {
    const { data, error } = await supabase
        .from("categories")
        .select("id, user_id, name, icon, color, type, is_default, created_at")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

    if (error) {
        const notFound = error.code === "PGRST116";
        if (notFound) {
            throw new ServiceError("Kategori tidak ditemukan.", 404);
        }
        throw mapDbError(error);
    }

    return mapRowToCategory(data);
}

export async function createCategory(
    supabase: SupabaseClient,
    userId: string,
    dto: CreateCategoryDTO,
): Promise<Category> {
    if (!dto.name?.trim()) {
        throw new ServiceError("Nama kategori wajib diisi.", 400);
    }

    const insertRow = {
        ...mapDTOToInsertRow(dto),
        user_id: userId,
    };

    const { data, error } = await supabase
        .from("categories")
        .insert(insertRow)
        .select("id, user_id, name, icon, color, type, is_default, created_at")
        .single();

    if (error) {
        throw mapDbError(error);
    }

    return mapRowToCategory(data);
}

export async function deleteCategory(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<void> {
    const existing = await getCategoryById(supabase, userId, id);
    if (existing.isDefault) {
        throw new ServiceError("Kategori default tidak dapat dihapus.", 400);
    }

    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) {
        throw mapDbError(error);
    }
}
