-- 1) Tambahkan kolom client_id untuk idempotensi
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS client_id UUID;

ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS client_id UUID;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS client_id UUID;

-- 2) Unique index (user_id, client_id)
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_client_id_key
  ON categories (user_id, client_id)
  WHERE client_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS wallets_user_client_id_key
  ON wallets (user_id, client_id)
  WHERE client_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_user_client_id_key
  ON transactions (user_id, client_id)
  WHERE client_id IS NOT NULL;

-- 3) Normalisasi nama untuk pencocokan
CREATE OR REPLACE FUNCTION public.normalize_name(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(lower(trim(coalesce(input, ''))), '\s+', ' ', 'g');
$$;

-- 4) RPC untuk sync guest data (atomic transaction)
CREATE OR REPLACE FUNCTION public.sync_guest_data(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  inserted_wallets int := 0;
  inserted_categories int := 0;
  added_categories int := 0;
  inserted_transactions int := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Pastikan kategori Saldo Awal/Adjustment tersedia
  IF NOT EXISTS (
    SELECT 1
    FROM categories
    WHERE user_id = v_user_id
      AND normalize_name(name) = normalize_name('Saldo Awal/Adjustment')
      AND type = 'income'
  ) THEN
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Saldo Awal/Adjustment', 'ADJ', '#22c55e', 'income', false, v_user_id);
    inserted_categories := inserted_categories + 1;
  END IF;

  -- Insert wallet yang belum ada (match by normalized name)
  WITH guest_wallets AS (
    SELECT
      (value->>'clientId')::uuid AS client_id,
      value->>'name' AS name,
      COALESCE(NULLIF(value->>'category', ''), 'Umum') AS category,
      COALESCE(NULLIF(value->>'location', ''), 'Lokal') AS location
    FROM jsonb_array_elements(COALESCE(payload->'wallets', '[]'::jsonb)) AS value
  ),
  existing AS (
    SELECT id, normalize_name(name) AS nname
    FROM wallets
    WHERE user_id = v_user_id
  ),
  to_insert AS (
    SELECT gw.client_id, gw.name, gw.category, gw.location
    FROM guest_wallets gw
    LEFT JOIN existing e
      ON e.nname = normalize_name(gw.name)
    WHERE e.id IS NULL
  ),
  inserted AS (
    INSERT INTO wallets (name, category, location, is_default, user_id, client_id)
    SELECT name, category, location, false, v_user_id, client_id
    FROM to_insert
    ON CONFLICT (user_id, client_id) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO inserted_wallets FROM inserted;

  -- Insert kategori yang belum ada (match by normalized name + type)
  WITH guest_categories AS (
    SELECT
      (value->>'clientId')::uuid AS client_id,
      value->>'name' AS name,
      value->>'icon' AS icon,
      value->>'color' AS color,
      value->>'type' AS type
    FROM jsonb_array_elements(COALESCE(payload->'categories', '[]'::jsonb)) AS value
  ),
  existing AS (
    SELECT id, normalize_name(name) AS nname, type
    FROM categories
    WHERE user_id = v_user_id
  ),
  to_insert AS (
    SELECT gc.client_id, gc.name, gc.icon, gc.color, gc.type
    FROM guest_categories gc
    LEFT JOIN existing e
      ON e.nname = normalize_name(gc.name) AND e.type = gc.type
    WHERE e.id IS NULL
  ),
  inserted AS (
    INSERT INTO categories (name, icon, color, type, is_default, user_id, client_id)
    SELECT
      name,
      COALESCE(NULLIF(icon, ''), 'MISC'),
      COALESCE(NULLIF(color, ''), '#64748b'),
      type,
      false,
      v_user_id,
      client_id
    FROM to_insert
    ON CONFLICT (user_id, client_id) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO added_categories FROM inserted;
  inserted_categories := inserted_categories + added_categories;

  -- Insert transaksi (map kategori & dompet by normalized name)
  WITH guest_transactions AS (
    SELECT
      (value->>'clientId')::uuid AS client_id,
      value->>'type' AS type,
      (value->>'amount')::numeric AS amount,
      value->>'categoryName' AS category_name,
      value->>'categoryType' AS category_type,
      value->>'walletName' AS wallet_name,
      value->>'date' AS date,
      value->>'note' AS note
    FROM jsonb_array_elements(COALESCE(payload->'transactions', '[]'::jsonb)) AS value
  ),
  wallet_lookup AS (
    SELECT id, normalize_name(name) AS nname
    FROM wallets
    WHERE user_id = v_user_id
  ),
  category_lookup AS (
    SELECT id, normalize_name(name) AS nname, type
    FROM categories
    WHERE user_id = v_user_id
  ),
  prepared AS (
    SELECT
      gt.client_id,
      gt.type,
      gt.amount,
      cl.id AS category_id,
      wl.id AS wallet_id,
      gt.date,
      gt.note
    FROM guest_transactions gt
    LEFT JOIN wallet_lookup wl
      ON wl.nname = normalize_name(gt.wallet_name)
    LEFT JOIN category_lookup cl
      ON cl.nname = normalize_name(gt.category_name) AND cl.type = gt.category_type
  ),
  inserted AS (
    INSERT INTO transactions (type, amount, category_id, wallet_id, date, note, user_id, client_id)
    SELECT
      type,
      amount,
      category_id,
      wallet_id,
      date::date,
      COALESCE(note, ''),
      v_user_id,
      client_id
    FROM prepared
    ON CONFLICT (user_id, client_id) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO inserted_transactions FROM inserted;
  -- Optional: update wallet balance by delta if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'balance'
  ) THEN
    WITH guest_transactions AS (
      SELECT
        (value->>'clientId')::uuid AS client_id,
        value->>'type' AS type,
        (value->>'amount')::numeric AS amount,
        value->>'categoryName' AS category_name,
        value->>'categoryType' AS category_type,
        value->>'walletName' AS wallet_name,
        value->>'date' AS date,
        value->>'note' AS note
      FROM jsonb_array_elements(COALESCE(payload->'transactions', '[]'::jsonb)) AS value
    ),
    wallet_lookup AS (
      SELECT id, normalize_name(name) AS nname
      FROM wallets
      WHERE user_id = v_user_id
    ),
    prepared AS (
      SELECT
        gt.type,
        gt.amount,
        wl.id AS wallet_id
      FROM guest_transactions gt
      LEFT JOIN wallet_lookup wl
        ON wl.nname = normalize_name(gt.wallet_name)
    ),
    deltas AS (
      SELECT
        wallet_id,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS delta
      FROM prepared
      WHERE wallet_id IS NOT NULL
      GROUP BY wallet_id
    )
    UPDATE wallets w
    SET balance = COALESCE(w.balance, 0) + deltas.delta
    FROM deltas
    WHERE w.id = deltas.wallet_id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'ok',
    'inserted', jsonb_build_object(
      'transactions', inserted_transactions,
      'categories', inserted_categories,
      'wallets', inserted_wallets
    )
  );
END;
$$;



GRANT EXECUTE ON FUNCTION public.sync_guest_data(jsonb) TO authenticated;

