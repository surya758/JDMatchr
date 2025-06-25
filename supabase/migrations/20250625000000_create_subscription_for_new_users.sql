-- Update the handle_new_user function to also create a default subscription
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
    
    -- Insert default free subscription
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
        1,  -- Free plan gets 1 credit
        0   -- No credits used initially
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile and default free subscription when a new user signs up'; 