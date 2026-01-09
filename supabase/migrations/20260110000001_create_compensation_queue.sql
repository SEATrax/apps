-- Create compensation queue for handling failed operations
CREATE TABLE IF NOT EXISTS compensation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type text NOT NULL CHECK (task_type IN ('metadata_sync', 'payment_link', 'ipfs_cleanup')),
  token_id bigint NOT NULL,
  payload jsonb NOT NULL,
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  next_retry timestamp with time zone DEFAULT now(),
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Create indexes for efficient processing
CREATE INDEX IF NOT EXISTS idx_compensation_queue_status_next_retry 
ON compensation_queue(status, next_retry) 
WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_compensation_queue_token_id 
ON compensation_queue(token_id);

CREATE INDEX IF NOT EXISTS idx_compensation_queue_task_type 
ON compensation_queue(task_type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_compensation_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_compensation_queue_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_compensation_queue_updated_at_trigger
      BEFORE UPDATE ON compensation_queue
      FOR EACH ROW
      EXECUTE FUNCTION update_compensation_queue_updated_at();
  END IF;
END
$$;