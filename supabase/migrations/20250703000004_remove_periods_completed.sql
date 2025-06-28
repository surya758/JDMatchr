-- Remove periods_completed column since DODO handles all period tracking
-- We only need to store the total period info for reference, not track progress

-- Drop the periods_completed column
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS periods_completed;

-- Update comment to reflect simplified approach
COMMENT ON COLUMN public.subscriptions.subscription_period_count IS 'Total number of periods in subscription commitment - tracking handled by DODO';
COMMENT ON COLUMN public.subscriptions.natural_expiry_date IS 'When subscription naturally expires - DODO sends subscription.expired webhook'; 