-- Add new subscription statuses: on_hold, paused, failed
-- Update the status column CHECK constraint to include new values

-- Drop existing check constraint if it exists
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- Add new check constraint with all status values
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check 
  CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'on_hold', 'paused', 'failed'));

-- Update comment for documentation
COMMENT ON COLUMN public.subscriptions.status IS 'Current subscription status: active, cancelled, expired, past_due, on_hold, paused, failed'; 