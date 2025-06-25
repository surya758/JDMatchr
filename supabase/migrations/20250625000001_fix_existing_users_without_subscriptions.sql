-- Create default free subscriptions for any existing users who don't have one
-- This handles edge cases where users might exist without subscriptions
INSERT INTO public.subscriptions (
    user_id, 
    plan_name, 
    status, 
    current_period_start, 
    current_period_end,
    job_credits,
    job_credits_used
)
SELECT 
    u.id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '1 month',
    1,  -- Free plan gets 1 credit
    0   -- No credits used initially
FROM public.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
WHERE s.user_id IS NULL;

-- Log how many users were affected
DO $$
DECLARE
    affected_count INTEGER;
BEGIN
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RAISE NOTICE 'Created default subscriptions for % existing users', affected_count;
END $$; 