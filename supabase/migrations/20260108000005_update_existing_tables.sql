-- Add missing columns to existing tables

-- Add missing columns to exporters table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exporters' AND column_name = 'phone') THEN
    ALTER TABLE exporters ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exporters' AND column_name = 'address') THEN
    ALTER TABLE exporters ADD COLUMN address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exporters' AND column_name = 'updated_at') THEN
    ALTER TABLE exporters ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
  
  -- Update created_at to have timezone
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exporters' AND column_name = 'created_at' AND data_type = 'timestamp without time zone') THEN
    ALTER TABLE exporters ALTER COLUMN created_at TYPE timestamp with time zone;
  END IF;
END
$$;

-- Add missing columns to investors table  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investors' AND column_name = 'email') THEN
    ALTER TABLE investors ADD COLUMN email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investors' AND column_name = 'phone') THEN
    ALTER TABLE investors ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investors' AND column_name = 'investment_amount_total') THEN
    ALTER TABLE investors ADD COLUMN investment_amount_total decimal DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investors' AND column_name = 'updated_at') THEN
    ALTER TABLE investors ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
  
  -- Update created_at to have timezone
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investors' AND column_name = 'created_at' AND data_type = 'timestamp without time zone') THEN
    ALTER TABLE investors ALTER COLUMN created_at TYPE timestamp with time zone;
  END IF;
END
$$;