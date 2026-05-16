
-- 1) Add columns 
ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Umum';

ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'Lokal';

-- 2) Backfill existing rows that have NULL (edge-case safety)
UPDATE wallets
SET category = 'Umum'
WHERE category IS NULL;

UPDATE wallets
SET location = 'Lokal'
WHERE location IS NULL;

-- 3) Verify
SELECT id, name, category, location
FROM wallets
ORDER BY created_at;
