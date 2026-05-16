-- Migration to add is_bill column to transactions table

ALTER TABLE transactions 
ADD COLUMN is_bill BOOLEAN NOT NULL DEFAULT FALSE;

-- Optional: Update comment to explain the column usage
COMMENT ON COLUMN transactions.is_bill IS 'If true, the transaction is treated as an urgent bill on the dashboard.';
