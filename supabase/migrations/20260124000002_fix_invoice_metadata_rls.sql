-- Fix RLS for invoice_metadata
-- Timestamp: 20260124000002

-- Enable RLS (idempotent)
ALTER TABLE invoice_metadata ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (public data like invoices on chain)
-- In production, might restrict full details, but for this caching layer it mirrors blockchain public data.
DROP POLICY IF EXISTS "Anyone can access invoice_metadata" ON invoice_metadata;
CREATE POLICY "Anyone can access invoice_metadata"
ON invoice_metadata FOR SELECT
USING (true);

-- Allow inserting/updating for authenticated (or anon for POC)
DROP POLICY IF EXISTS "Anyone can insert invoice_metadata" ON invoice_metadata;
CREATE POLICY "Anyone can insert invoice_metadata"
ON invoice_metadata FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update invoice_metadata" ON invoice_metadata;
CREATE POLICY "Anyone can update invoice_metadata"
ON invoice_metadata FOR UPDATE
USING (true);
