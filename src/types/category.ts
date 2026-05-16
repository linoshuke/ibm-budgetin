import type { TransactionType } from "@/types/transaction";

export type CategoryType = TransactionType | "both";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isDefault: boolean;
}
