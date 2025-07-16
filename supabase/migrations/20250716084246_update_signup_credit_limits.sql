-- Update signup credit limits to be consistent with new credit system
-- This fixes the issue where new users were getting 1 credit instead of 10

-- Update the handle_new_user function to assign 10 credits for free plan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user record
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Insert default free subscription with 10 credits
    INSERT INTO public.subscriptions (
        user_id, 
        plan_name, 
        status, 
        current_period_start, 
        current_period_end,
        job_credits,
        job_credits_used
    )
    VALUES (
        NEW.id,
        'free',
        'active',
        NOW(),
        NOW() + INTERVAL '1 month',
        10,  -- Free plan gets 10 credits (updated from 1)
        0   -- No credits used initially
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile and default free subscription with 10 credits when a new user signs up';

-- Update any existing users who might have been created with 1 credit to have 10 credits
UPDATE public.subscriptions 
SET job_credits = 10
WHERE plan_name = 'free' 
  AND job_credits = 1 
  AND status = 'active';

-- Add a comment to document the change
COMMENT ON COLUMN public.subscriptions.job_credits IS 'Credits allocated for subscription plan: Free=10, Pro=100, Enterprise=999';