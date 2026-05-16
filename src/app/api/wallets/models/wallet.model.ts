import type { Wallet } from "@/types/wallet";

export interface WalletRow {
    id: string;
    user_id?: string;
    name: string;
    category: string | null;
    location: string | null;
    balance?: number | string | null;
    is_default: boolean;
    created_at?: string;
}

export interface CreateWalletDTO {
    name: string;
    category: string;
    location: string;
}

export interface UpdateWalletDTO {
    name: string;
    category?: string;
    location?: string;
}

export function mapRowToWallet(row: WalletRow): Wallet {
    return {
        id: row.id,
        name: row.name,
        category: row.category ?? "Umum",
        location: row.location ?? "Lokal",
        isDefault: row.is_default,
        balance: row.balance !== undefined && row.balance !== null ? Number(row.balance) : undefined,
    };
}

export function mapRowsToWallets(rows: WalletRow[]): Wallet[] {
    return rows.map(mapRowToWallet);
}

export function mapDTOToInsertRow(dto: CreateWalletDTO): Omit<WalletRow, "id" | "user_id" | "created_at"> {
    return {
        name: dto.name,
        category: dto.category,
        location: dto.location,
        is_default: false,
    };
}
