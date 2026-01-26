-- Migration to ensure exporter_wallet exists in invoice_metadata
-- Timestamp: 20260124000001

-- Add exporter_wallet column if it doesn't exist
-- This allows invoices to be queried by exporter address
ALTER TABLE invoice_metadata 
ADD COLUMN IF NOT EXISTS exporter_wallet text;

-- Create index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_invoice_metadata_exporter_wallet ON invoice_metadata(exporter_wallet);
