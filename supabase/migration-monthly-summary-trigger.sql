-- Trigger to keep monthly_summary in sync with transactions
CREATE OR REPLACE FUNCTION public.update_monthly_summary()
RETURNS TRIGGER AS $$
DECLARE
  v_year INT;
  v_month INT;
  v_income_delta NUMERIC;
  v_expense_delta NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.wallet_id IS NULL THEN
      RETURN NEW;
    END IF;

    v_year := EXTRACT(YEAR FROM NEW.date::date);
    v_month := EXTRACT(MONTH FROM NEW.date::date);
    v_income_delta := CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE 0 END;
    v_expense_delta := CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END;

    INSERT INTO monthly_summary (user_id, wallet_id, year, month, total_income, total_expense)
    VALUES (NEW.user_id, NEW.wallet_id, v_year, v_month, v_income_delta, v_expense_delta)
    ON CONFLICT (user_id, wallet_id, year, month)
    DO UPDATE SET
      total_income = monthly_summary.total_income + EXCLUDED.total_income,
      total_expense = monthly_summary.total_expense + EXCLUDED.total_expense;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.wallet_id IS NULL THEN
      RETURN OLD;
    END IF;

    v_year := EXTRACT(YEAR FROM OLD.date::date);
    v_month := EXTRACT(MONTH FROM OLD.date::date);
    v_income_delta := CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE 0 END;
    v_expense_delta := CASE WHEN OLD.type = 'expense' THEN OLD.amount ELSE 0 END;

    UPDATE monthly_summary
    SET total_income = total_income - v_income_delta,
        total_expense = total_expense - v_expense_delta
    WHERE user_id = OLD.user_id
      AND wallet_id = OLD.wallet_id
      AND year = v_year
      AND month = v_month;

    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.wallet_id IS NULL AND NEW.wallet_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- subtract old values
    IF OLD.wallet_id IS NOT NULL THEN
      v_year := EXTRACT(YEAR FROM OLD.date::date);
      v_month := EXTRACT(MONTH FROM OLD.date::date);
      v_income_delta := CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE 0 END;
      v_expense_delta := CASE WHEN OLD.type = 'expense' THEN OLD.amount ELSE 0 END;

      UPDATE monthly_summary
      SET total_income = total_income - v_income_delta,
          total_expense = total_expense - v_expense_delta
      WHERE user_id = OLD.user_id
        AND wallet_id = OLD.wallet_id
        AND year = v_year
        AND month = v_month;
    END IF;

    -- add new values
    IF NEW.wallet_id IS NOT NULL THEN
      v_year := EXTRACT(YEAR FROM NEW.date::date);
      v_month := EXTRACT(MONTH FROM NEW.date::date);
      v_income_delta := CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE 0 END;
      v_expense_delta := CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END;

      INSERT INTO monthly_summary (user_id, wallet_id, year, month, total_income, total_expense)
      VALUES (NEW.user_id, NEW.wallet_id, v_year, v_month, v_income_delta, v_expense_delta)
      ON CONFLICT (user_id, wallet_id, year, month)
      DO UPDATE SET
        total_income = monthly_summary.total_income + EXCLUDED.total_income,
        total_expense = monthly_summary.total_expense + EXCLUDED.total_expense;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_monthly_summary ON transactions;
CREATE TRIGGER trg_update_monthly_summary
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION public.update_monthly_summary();
