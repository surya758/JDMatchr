-- Add 'replaced' status for subscriptions that have been superseded by retry payments
-- This status indicates that a subscription has been replaced by a new one during payment retry flow

-- Drop existing check constraint
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- Add new check constraint with 'replaced' status
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check 
  CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'on_hold', 'paused', 'failed', 'pending', 'completed', 'replaced'));

-- Update comment for documentation
COMMENT ON COLUMN public.subscriptions.status IS 'Current subscription status: active, cancelled, expired, past_due, on_hold, paused, failed, pending, completed, replaced'; 