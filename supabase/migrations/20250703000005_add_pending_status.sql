-- Add 'pending' and 'completed' status for multiple subscription architecture
-- This allows subscriptions to be created before payment confirmation
-- and supports billing history with completed subscription records

-- Add payment_id column for invoice downloads
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_subscription_id ON subscriptions(dodo_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_id ON subscriptions(payment_id);

-- Add 'pending' and 'completed' status to subscription status CHECK constraint
-- Drop existing check constraint
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- Add new check constraint with pending and completed status values
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check 
  CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'on_hold', 'paused', 'failed', 'pending', 'completed'));

-- Update comment for documentation
COMMENT ON COLUMN public.subscriptions.status IS 'Current subscription status: active, cancelled, expired, past_due, on_hold, paused, failed, pending, completed';
