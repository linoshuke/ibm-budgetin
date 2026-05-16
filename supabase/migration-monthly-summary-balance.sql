-- 1) Tambahkan kolom balance pada wallets (jika belum ada)
ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS balance NUMERIC NOT NULL DEFAULT 0;

UPDATE wallets
SET balance = 0
WHERE balance IS NULL;

-- 2) Tabel monthly_summary untuk ringkasan bulanan per dompet
CREATE TABLE IF NOT EXISTS monthly_summary (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id     UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  year          INT NOT NULL CHECK (year >= 2000),
  month         INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_income  NUMERIC NOT NULL DEFAULT 0,
  total_expense NUMERIC NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS monthly_summary_unique
  ON monthly_summary (user_id, wallet_id, year, month);

ALTER TABLE monthly_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own monthly summary" ON monthly_summary;
CREATE POLICY "Users can view own monthly summary"
  ON monthly_summary FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own monthly summary" ON monthly_summary;
CREATE POLICY "Users can insert own monthly summary"
  ON monthly_summary FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own monthly summary" ON monthly_summary;
CREATE POLICY "Users can update own monthly summary"
  ON monthly_summary FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own monthly summary" ON monthly_summary;
CREATE POLICY "Users can delete own monthly summary"
  ON monthly_summary FOR DELETE
  USING (user_id = auth.uid());
