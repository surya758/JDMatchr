-- Function to process expired subscriptions
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
  INSERT INTO public.subscriptions (user_id, plan_name, status, current_period_start, current_period_end, cancel_at_period_end)
  SELECT 
    s.user_id,
    'free' as plan_name,
    'active' as status,
    NOW() as current_period_start,
    NOW() + INTERVAL '1 month' as current_period_end,
    FALSE as cancel_at_period_end
  FROM public.subscriptions s
  WHERE 
    s.status = 'expired'
    AND s.user_id NOT IN (
      SELECT user_id 
      FROM public.subscriptions 
      WHERE status = 'active'
    );
  
  -- Update job credits to 1 for users who were downgraded
  UPDATE public.users 
  SET 
    job_credits = 1,
    updated_at = NOW()
  WHERE id IN (
    SELECT DISTINCT user_id 
    FROM public.subscriptions 
    WHERE status = 'expired'
    AND user_id NOT IN (
      SELECT user_id 
      FROM public.subscriptions 
      WHERE status = 'active'
    )
  );
  
  RETURN QUERY SELECT expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for testing)
GRANT EXECUTE ON FUNCTION process_expired_subscriptions() TO authenticated;

-- Function to manually expire a subscription (for testing)
CREATE OR REPLACE FUNCTION expire_subscription_for_testing(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Set the current subscription to expire 1 minute ago
  UPDATE public.subscriptions 
  SET 
    current_period_end = NOW() - INTERVAL '1 minute',
    updated_at = NOW()
  WHERE 
    user_id = target_user_id 
    AND status = 'active';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for testing)
GRANT EXECUTE ON FUNCTION expire_subscription_for_testing(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION process_expired_subscriptions() IS 'Processes expired subscriptions and downgrades users to free plan';
COMMENT ON FUNCTION expire_subscription_for_testing(UUID) IS 'Testing function to manually expire a subscription'; 