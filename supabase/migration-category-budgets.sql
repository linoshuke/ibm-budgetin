-- 1) Table: category_budgets
CREATE TABLE IF NOT EXISTS category_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Unique index per user/category/month
CREATE UNIQUE INDEX IF NOT EXISTS category_budgets_unique
  ON category_budgets (user_id, category_id, month_key);

-- 3) Enable RLS
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;

-- 4) Policies
DROP POLICY IF EXISTS "Users can view own category budgets" ON category_budgets;
CREATE POLICY "Users can view own category budgets"
  ON category_budgets FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own category budgets" ON category_budgets;
CREATE POLICY "Users can insert own category budgets"
  ON category_budgets FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own category budgets" ON category_budgets;
CREATE POLICY "Users can update own category budgets"
  ON category_budgets FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own category budgets" ON category_budgets;
CREATE POLICY "Users can delete own category budgets"
  ON category_budgets FOR DELETE
  USING (user_id = auth.uid());
