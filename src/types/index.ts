export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  category: string;
  location: string | null;
  balance: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
  is_default: boolean;
  created_at: string;
}

export interface CategoryBudget {
  id: string;
  user_id: string;
  category_id: string;
  month_key: string;
  target_amount: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  created_at: string;
  category_id?: string | null;
}

export interface MonthlySummary {
  id: string;
  user_id: string;
  wallet_id: string;
  year: number;
  month: number;
  total_income: number;
  total_expense: number;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  created_at: string;
}
