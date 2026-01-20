-- Migration to add blockchain caching and provenance columns
-- Timestamp: 20260120000001

-- 1. Modify invoice_metadata table
ALTER TABLE invoice_metadata
ADD COLUMN IF NOT EXISTS status text, -- InvoiceStatus enum
ADD COLUMN IF NOT EXISTS pool_id bigint,
ADD COLUMN IF NOT EXISTS shipping_amount numeric, -- USD Cents
ADD COLUMN IF NOT EXISTS loan_amount numeric,     -- USD Cents
ADD COLUMN IF NOT EXISTS amount_invested numeric, -- ETH Wei
ADD COLUMN IF NOT EXISTS amount_withdrawn numeric,-- ETH Wei
ADD COLUMN IF NOT EXISTS shipping_date bigint,    -- Unix Timestamp
ADD COLUMN IF NOT EXISTS contract_address text,
ADD COLUMN IF NOT EXISTS block_number bigint,
ADD COLUMN IF NOT EXISTS transaction_hash text;

-- Create index for status query performance
CREATE INDEX IF NOT EXISTS idx_invoice_metadata_status ON invoice_metadata(status);
CREATE INDEX IF NOT EXISTS idx_invoice_metadata_pool_id ON invoice_metadata(pool_id);


-- 2. Modify pool_metadata table
ALTER TABLE pool_metadata
ADD COLUMN IF NOT EXISTS status text, -- PoolStatus enum
ADD COLUMN IF NOT EXISTS start_date bigint,      -- Unix Timestamp
ADD COLUMN IF NOT EXISTS end_date bigint,        -- Unix Timestamp
ADD COLUMN IF NOT EXISTS total_loan_amount numeric,     -- USD Cents
ADD COLUMN IF NOT EXISTS total_shipping_amount numeric, -- USD Cents
ADD COLUMN IF NOT EXISTS amount_invested numeric,       -- ETH Wei
ADD COLUMN IF NOT EXISTS amount_distributed numeric,    -- ETH Wei
ADD COLUMN IF NOT EXISTS contract_address text,
ADD COLUMN IF NOT EXISTS block_number bigint,
ADD COLUMN IF NOT EXISTS transaction_hash text;

-- Create index for pool status
CREATE INDEX IF NOT EXISTS idx_pool_metadata_status ON pool_metadata(status);


-- 3. Create investments table
CREATE TABLE IF NOT EXISTS investments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id bigint NOT NULL, -- Logical link to pool_metadata.pool_id (not FK to avoid strict dependency order)
    investor_address text NOT NULL,
    amount numeric NOT NULL,      -- ETH Wei
    percentage numeric NOT NULL,  -- Basis Points
    timestamp bigint NOT NULL,    -- Unix Timestamp
    
    -- Provenance
    contract_address text,
    block_number bigint,
    transaction_hash text,
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Policies for investments
DROP POLICY IF EXISTS "Anyone can read investments" ON investments;
CREATE POLICY "Anyone can read investments"
ON investments FOR SELECT
USING (true);

-- Allow authenticated users or anon (wallet users) to insert
DROP POLICY IF EXISTS "Anyone can insert investments" ON investments;
DROP POLICY IF EXISTS "Authenticated users can insert investments" ON investments; -- Cleanup old name just in case
CREATE POLICY "Anyone can insert investments"
ON investments FOR INSERT
WITH CHECK (true);

-- Create indexes for investments
CREATE INDEX IF NOT EXISTS idx_investments_pool_id ON investments(pool_id);
CREATE INDEX IF NOT EXISTS idx_investments_investor ON investments(investor_address);
CREATE INDEX IF NOT EXISTS idx_investments_contract_addr ON investments(contract_address);

-- Add updated_at trigger for investments
DROP TRIGGER IF EXISTS update_investments_updated_at ON investments;
CREATE TRIGGER update_investments_updated_at
    BEFORE UPDATE ON investments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
