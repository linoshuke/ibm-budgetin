-- Harden RLS for finance tables

-- Category budgets
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own category budgets" ON category_budgets;
DROP POLICY IF EXISTS "Users can insert own category budgets" ON category_budgets;
DROP POLICY IF EXISTS "Users can update own category budgets" ON category_budgets;
DROP POLICY IF EXISTS "Users can delete own category budgets" ON category_budgets;
CREATE POLICY "Users can view own category budgets"
  ON category_budgets FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own category budgets"
  ON category_budgets FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own category budgets"
  ON category_budgets FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own category budgets"
  ON category_budgets FOR DELETE
  USING (user_id = auth.uid());

-- Goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (user_id = auth.uid());

-- Monthly summary
ALTER TABLE monthly_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own monthly summary" ON monthly_summary;
CREATE POLICY "Users can view own monthly summary"
  ON monthly_summary FOR SELECT
  USING (user_id = auth.uid());
