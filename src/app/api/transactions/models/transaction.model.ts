import type { Transaction, TransactionType } from "@/types/transaction";

export interface TransactionRow {
    id: string;
    user_id?: string;
    type: TransactionType;
    amount: number | string;
    category_id: string;
    wallet_id: string | null;
    date: string;
    note: string | null;
    is_bill: boolean;
    created_at?: string;
}

export interface CreateTransactionDTO {
    type: TransactionType;
    amount: number;
    categoryId: string;
    walletId: string;
    date: string;
    note?: string;
    isBill?: boolean;
}

export type UpdateTransactionDTO = CreateTransactionDTO;

export function mapRowToTransaction(row: TransactionRow): Transaction {
    return {
        id: row.id,
        type: row.type,
        amount: Number(row.amount),
        categoryId: row.category_id,
        walletId: row.wallet_id ?? "",
        date: row.date,
        note: row.note ?? "",
        isBill: row.is_bill,
    };
}

export function mapRowsToTransactions(rows: TransactionRow[]): Transaction[] {
    return rows.map(mapRowToTransaction);
}

export function mapCreateDTOToInsertRow(dto: CreateTransactionDTO): Omit<TransactionRow, "id" | "user_id" | "created_at"> {
    return {
        type: dto.type,
        amount: dto.amount,
        category_id: dto.categoryId,
        wallet_id: dto.walletId,
        date: dto.date,
        note: dto.note ?? "",
        is_bill: dto.isBill ?? false,
    };
}

export function mapUpdateDTOToUpdateRow(dto: UpdateTransactionDTO): Omit<TransactionRow, "id" | "user_id" | "created_at"> {
    return {
        type: dto.type,
        amount: dto.amount,
        category_id: dto.categoryId,
        wallet_id: dto.walletId,
        date: dto.date,
        note: dto.note ?? "",
        is_bill: dto.isBill ?? false,
    };
}
