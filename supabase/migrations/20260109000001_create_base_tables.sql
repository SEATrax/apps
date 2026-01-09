-- Create missing base tables for exporters and investors
-- These are the core tables that should have existed from the beginning

-- Create exporters table
CREATE TABLE IF NOT EXISTS exporters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    tax_id TEXT NOT NULL,
    country TEXT NOT NULL,
    export_license TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    phone TEXT,
    address TEXT,
    contact_person TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create investors table  
CREATE TABLE IF NOT EXISTS investors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    investment_amount_total DECIMAL DEFAULT 0,
    total_returns DECIMAL DEFAULT 0,
    active_investments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on both tables
ALTER TABLE exporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exporters
CREATE POLICY "Anyone can read verified exporters" 
ON exporters FOR SELECT 
USING (is_verified = true);

CREATE POLICY "Anyone can insert exporter profiles" 
ON exporters FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Exporters can update their own profiles" 
ON exporters FOR UPDATE 
USING (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Create RLS policies for investors
CREATE POLICY "Anyone can read investor profiles" 
ON investors FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert investor profiles" 
ON investors FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Investors can update their own profiles" 
ON investors FOR UPDATE 
USING (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS exporters_wallet_address_idx ON exporters(wallet_address);
CREATE INDEX IF NOT EXISTS exporters_verified_idx ON exporters(is_verified);
CREATE INDEX IF NOT EXISTS investors_wallet_address_idx ON investors(wallet_address);
CREATE INDEX IF NOT EXISTS exporters_created_at_idx ON exporters(created_at);
CREATE INDEX IF NOT EXISTS investors_created_at_idx ON investors(created_at);

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_exporters_updated_at ON exporters;
CREATE TRIGGER update_exporters_updated_at
    BEFORE UPDATE ON exporters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investors_updated_at ON investors;
CREATE TRIGGER update_investors_updated_at
    BEFORE UPDATE ON investors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();