-- Remove unnecessary automated natural expiry processing
-- DODO webhooks already handle subscription.expired events

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_check_natural_expiry ON public.subscriptions;

-- Drop the trigger function
DROP FUNCTION IF EXISTS check_natural_expiry_trigger();

-- Drop the manual processing function (keeping only the period tracking)
DROP FUNCTION IF EXISTS process_naturally_expired_subscriptions();

-- Add comment explaining the approach
COMMENT ON COLUMN public.subscriptions.natural_expiry_date IS 'When subscription naturally expires - handled via DODO webhook events, not automated processing'; 