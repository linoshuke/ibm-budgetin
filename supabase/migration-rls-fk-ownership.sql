-- Enforce FK ownership on transactions
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      wallet_id IS NULL
      OR EXISTS (
        SELECT 1 FROM wallets w
        WHERE w.id = wallet_id AND w.user_id = auth.uid()
      )
    )
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1 FROM categories c
        WHERE c.id = category_id AND c.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      wallet_id IS NULL
      OR EXISTS (
        SELECT 1 FROM wallets w
        WHERE w.id = wallet_id AND w.user_id = auth.uid()
      )
    )
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1 FROM categories c
        WHERE c.id = category_id AND c.user_id = auth.uid()
      )
    )
  );

-- Enforce FK ownership on category budgets
DROP POLICY IF EXISTS "Users can insert own category budgets" ON category_budgets;
CREATE POLICY "Users can insert own category budgets"
  ON category_budgets FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM categories c
      WHERE c.id = category_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own category budgets" ON category_budgets;
CREATE POLICY "Users can update own category budgets"
  ON category_budgets FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM categories c
      WHERE c.id = category_id AND c.user_id = auth.uid()
    )
  );

-- Enforce FK ownership on monthly summary
DROP POLICY IF EXISTS "Users can insert own monthly summary" ON monthly_summary;
CREATE POLICY "Users can insert own monthly summary"
  ON monthly_summary FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM wallets w
      WHERE w.id = wallet_id AND w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own monthly summary" ON monthly_summary;
CREATE POLICY "Users can update own monthly summary"
  ON monthly_summary FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM wallets w
      WHERE w.id = wallet_id AND w.user_id = auth.uid()
    )
  );
