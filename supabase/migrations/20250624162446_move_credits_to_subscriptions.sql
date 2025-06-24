-- Move job_credits from users table to subscriptions table
-- This provides better data modeling where credits are tied to subscription plans

-- Add job_credits column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN job_credits INTEGER NOT NULL DEFAULT 1;

-- Add job_credits_used column to track usage within the subscription period
ALTER TABLE public.subscriptions 
ADD COLUMN job_credits_used INTEGER NOT NULL DEFAULT 0;

-- Update existing subscriptions with appropriate credit amounts based on plan
UPDATE public.subscriptions 
SET job_credits = CASE 
  WHEN plan_name = 'free' THEN 1
  WHEN plan_name = 'pro' THEN 30
  WHEN plan_name = 'enterprise' THEN 999
  ELSE 1
END;

-- Copy current job_credits from users to their active subscription
UPDATE public.subscriptions 
SET job_credits_used = GREATEST(0, 
  CASE 
    WHEN plan_name = 'free' THEN 1 - COALESCE((SELECT job_credits FROM public.users WHERE id = subscriptions.user_id), 1)
    WHEN plan_name = 'pro' THEN 30 - COALESCE((SELECT job_credits FROM public.users WHERE id = subscriptions.user_id), 30)
    WHEN plan_name = 'enterprise' THEN 999 - COALESCE((SELECT job_credits FROM public.users WHERE id = subscriptions.user_id), 999)
    ELSE 0
  END
)
WHERE status = 'active';

-- Remove job_credits column from users table (no longer needed)
ALTER TABLE public.users 
DROP COLUMN IF EXISTS job_credits;

-- Add comments for documentation
COMMENT ON COLUMN public.subscriptions.job_credits IS 'Total credits allocated for this subscription plan';
COMMENT ON COLUMN public.subscriptions.job_credits_used IS 'Credits used in the current subscription period';

-- Update the process_expired_subscriptions function to not update user credits
-- since credits are now on subscriptions
CREATE OR REPLACE FUNCTION process_expired_subscriptions()
RETURNS TABLE(processed_count INT) AS $$
DECLARE
  expired_count INT := 0;
BEGIN
  -- Update expired subscriptions to 'expired' status
  UPDATE public.subscriptions 
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status = 'active' 
    AND current_period_end < NOW()
    AND current_period_end IS NOT NULL;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Create new free subscriptions for users whose subscriptions expired
  INSERT INTO public.subscriptions (user_id, plan_name, status, current_period_start, current_period_end, cancel_at_period_end, job_credits, job_credits_used)
  SELECT 
    s.user_id,
    'free' as plan_name,
    'active' as status,
    NOW() as current_period_start,
    NOW() + INTERVAL '1 month' as current_period_end,
    FALSE as cancel_at_period_end,
    1 as job_credits,
    0 as job_credits_used
  FROM public.subscriptions s
  WHERE 
    s.status = 'expired'
    AND s.user_id NOT IN (
      SELECT user_id 
      FROM public.subscriptions 
      WHERE status = 'active'
    );
  
  RETURN QUERY SELECT expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 