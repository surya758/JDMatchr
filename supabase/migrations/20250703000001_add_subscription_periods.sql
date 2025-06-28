-- Add subscription period tracking for natural expiration handling
-- This tracks the total subscription commitment period vs individual billing cycles

-- Add new columns for subscription period tracking
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS subscription_period_count INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_period_interval TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS periods_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS natural_expiry_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add check constraint for subscription_period_interval
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_period_interval_check 
CHECK (subscription_period_interval IS NULL OR subscription_period_interval IN ('Day', 'Month', 'Year'));

-- Add comments for documentation
COMMENT ON COLUMN public.subscriptions.subscription_period_count IS 'Total number of periods in subscription commitment (e.g., 12 for annual)';
COMMENT ON COLUMN public.subscriptions.subscription_period_interval IS 'Period interval: Day, Month, Year';
COMMENT ON COLUMN public.subscriptions.periods_completed IS 'Number of billing periods completed in current subscription';
COMMENT ON COLUMN public.subscriptions.natural_expiry_date IS 'When subscription naturally expires after all periods complete';

-- Add index for natural expiry queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_natural_expiry 
ON public.subscriptions(natural_expiry_date) 
WHERE natural_expiry_date IS NOT NULL; 