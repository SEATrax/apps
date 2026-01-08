-- Create invoice_metadata table (if not exists)
CREATE TABLE IF NOT EXISTS invoice_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id bigint UNIQUE NOT NULL,
  exporter_wallet text NOT NULL,
  invoice_number text NOT NULL,
  goods_description text,
  importer_name text,
  importer_license text,
  importer_address text,
  importer_contact text,
  documents jsonb DEFAULT '[]'::jsonb,
  shipping_details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoice_metadata_token_id') THEN
    CREATE INDEX idx_invoice_metadata_token_id ON invoice_metadata(token_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoice_metadata_exporter') THEN
    CREATE INDEX idx_invoice_metadata_exporter ON invoice_metadata(exporter_wallet);
  END IF;
END
$$;

-- Create payments table (if not exists)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id bigint NOT NULL,
  token_id bigint NOT NULL,
  amount_usd decimal NOT NULL,
  interest_amount decimal DEFAULT 0,
  total_due decimal NOT NULL,
  payment_link text,
  payment_reference text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'link_generated', 'link_sent', 'paid', 'overdue', 'failed')),
  sent_at timestamp with time zone,
  paid_at timestamp with time zone,
  due_date timestamp with time zone,
  reminders_sent integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create pool_metadata table (if not exists)
CREATE TABLE IF NOT EXISTS pool_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id bigint UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  risk_category text DEFAULT 'medium',
  target_yield decimal DEFAULT 4.0,
  admin_wallet text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create payment indexes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_invoice_id') THEN
    CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_token_id') THEN
    CREATE INDEX idx_payments_token_id ON payments(token_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_status') THEN
    CREATE INDEX idx_payments_status ON payments(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pool_metadata_pool_id') THEN
    CREATE INDEX idx_pool_metadata_pool_id ON pool_metadata(pool_id);
  END IF;
END
$$;