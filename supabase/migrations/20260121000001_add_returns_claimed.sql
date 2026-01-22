-- Add returns_claimed column to investments table
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS returns_claimed BOOLEAN DEFAULT FALSE;

-- Update existing records effectively
UPDATE investments SET returns_claimed = FALSE WHERE returns_claimed IS NULL;
