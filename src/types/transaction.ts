export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  walletId: string;
  date: string;
  note?: string;
  isBill?: boolean;

  /**
   * Client-only UI state for optimistic updates.
   * Never persisted to the database.
   */
  clientStatus?: "optimistic" | "failed";
}
