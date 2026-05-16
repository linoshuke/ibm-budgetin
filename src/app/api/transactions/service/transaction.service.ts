import type { SupabaseClient } from "@supabase/supabase-js";
import type { Transaction } from "@/types/transaction";
import {
    type CreateTransactionDTO,
    type UpdateTransactionDTO,
    mapRowToTransaction,
    mapRowsToTransactions,
    mapCreateDTOToInsertRow,
    mapUpdateDTOToUpdateRow,
} from "@/app/api/transactions/models/transaction.model";
import { ServiceError, mapDbError } from "@/lib/service-error";

export async function getAllTransactions(
    supabase: SupabaseClient,
    userId: string,
): Promise<Transaction[]> {
    const { data, error } = await supabase
        .from("transactions")
        .select("id, type, amount, category_id, wallet_id, date, note, is_bill")
        .eq("user_id", userId)
        .order("date", { ascending: false });

    if (error) {
        throw mapDbError(error);
    }

    return mapRowsToTransactions(data ?? []);
}

export async function getTransactionById(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<Transaction> {
    const { data, error } = await supabase
        .from("transactions")
        .select("id, type, amount, category_id, wallet_id, date, note, is_bill")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

    if (error) {
        const notFound = error.code === "PGRST116";
        if (notFound) {
            throw new ServiceError("Transaksi tidak ditemukan.", 404);
        }
        throw mapDbError(error);
    }

    return mapRowToTransaction(data);
}

export async function getTransactionsByFilter(
    supabase: SupabaseClient,
    userId: string,
    options: {
        walletId?: string;
        walletIds?: string[];
        categoryId?: string;
        categoryIds?: string[];
        dateFrom?: string;
        dateTo?: string;
        type?: Transaction["type"];
        limit?: number;
        offset?: number;
    },
): Promise<Transaction[]> {
    let query = supabase
        .from("transactions")
        .select("id, type, amount, category_id, wallet_id, date, note, is_bill")
        .eq("user_id", userId)
        .order("date", { ascending: false });

    if (options.walletIds?.length) {
        query = query.in("wallet_id", options.walletIds);
    } else if (options.walletId) {
        query = query.eq("wallet_id", options.walletId);
    }
    if (options.categoryIds?.length) {
        query = query.in("category_id", options.categoryIds);
    } else if (options.categoryId) {
        query = query.eq("category_id", options.categoryId);
    }
    if (options.dateFrom) {
        query = query.gte("date", options.dateFrom);
    }
    if (options.dateTo) {
        query = query.lte("date", options.dateTo);
    }
    if (options.type) {
        query = query.eq("type", options.type);
    }
    if (options.limit !== undefined) {
        const offset = Math.max(0, options.offset ?? 0);
        const limit = Math.max(1, options.limit);
        query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
        throw mapDbError(error);
    }

    return mapRowsToTransactions(data ?? []);
}

export async function createTransaction(
    supabase: SupabaseClient,
    userId: string,
    dto: CreateTransactionDTO,
): Promise<Transaction> {
    const insertRow = {
        ...mapCreateDTOToInsertRow(dto),
        user_id: userId,
    };

    const { data, error } = await supabase
        .from("transactions")
        .insert(insertRow)
        .select("id, type, amount, category_id, wallet_id, date, note, is_bill")
        .single();

    if (error) {
        throw mapDbError(error);
    }

    return mapRowToTransaction(data);
}

export async function updateTransaction(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    dto: UpdateTransactionDTO,
): Promise<Transaction> {
    const updateRow = mapUpdateDTOToUpdateRow(dto);

    const { data, error } = await supabase
        .from("transactions")
        .update(updateRow)
        .eq("id", id)
        .eq("user_id", userId)
        .select("id, type, amount, category_id, wallet_id, date, note, is_bill")
        .single();

    if (error) {
        throw mapDbError(error);
    }

    return mapRowToTransaction(data);
}

export async function deleteTransaction(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<void> {
    const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) {
        throw mapDbError(error);
    }
}
