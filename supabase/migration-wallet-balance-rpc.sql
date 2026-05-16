-- Atomic wallet balance update via RPC
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_wallet_id UUID,
  p_user_id UUID,
  p_delta NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  UPDATE wallets
  SET balance = balance + p_delta
  WHERE id = p_wallet_id
    AND user_id = p_user_id
  RETURNING balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  RETURN new_balance;
END;
$$;
