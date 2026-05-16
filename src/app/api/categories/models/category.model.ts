import type { Category, CategoryType } from "@/types/category";

export interface CategoryRow {
    id: string;
    user_id: string;
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
    is_default: boolean;
    created_at: string;
}

export interface CreateCategoryDTO {
    name: string;
    icon?: string;
    color?: string;
    type: CategoryType;
}

export function mapRowToCategory(row: CategoryRow): Category {
    return {
        id: row.id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        type: row.type,
        isDefault: row.is_default,
    };
}

export function mapRowsToCategories(rows: CategoryRow[]): Category[] {
    return rows.map(mapRowToCategory);
}

export function mapDTOToInsertRow(dto: CreateCategoryDTO): Omit<CategoryRow, "id" | "user_id" | "created_at"> {
    return {
        name: dto.name,
        icon: dto.icon ?? "MISC",
        color: dto.color ?? "#64748b",
        type: dto.type,
        is_default: false,
    };
}
