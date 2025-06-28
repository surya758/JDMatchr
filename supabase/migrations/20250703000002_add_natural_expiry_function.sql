-- Function to process naturally expired subscriptions
-- This handles subscriptions that have completed their full period commitment (e.g., annual subscriptions)

CREATE OR REPLACE FUNCTION process_naturally_expired_subscriptions()
RETURNS TABLE(processed_count integer) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count integer := 0;
BEGIN
  -- Update subscriptions that have reached their natural expiry date
  UPDATE public.subscriptions 
  SET 
    status = 'expired',
    job_credits = 0,
    updated_at = NOW()
  WHERE 
    status = 'active'
    AND natural_expiry_date IS NOT NULL 
    AND natural_expiry_date <= NOW()
    AND (
      subscription_period_count IS NULL 
      OR periods_completed >= subscription_period_count
    );
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log the processing
  RAISE NOTICE 'Processed % naturally expired subscriptions', expired_count;
  
  RETURN QUERY SELECT expired_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION process_naturally_expired_subscriptions() TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION process_naturally_expired_subscriptions() IS 'Processes subscriptions that have completed their natural period commitment and should expire';

-- Create a trigger function to automatically check for natural expiry on subscription updates
CREATE OR REPLACE FUNCTION check_natural_expiry_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If subscription is active and has reached natural expiry date
  IF NEW.status = 'active' 
     AND NEW.natural_expiry_date IS NOT NULL 
     AND NEW.natural_expiry_date <= NOW()
     AND (NEW.subscription_period_count IS NULL OR NEW.periods_completed >= NEW.subscription_period_count)
  THEN
    NEW.status := 'expired';
    NEW.job_credits := 0;
    NEW.updated_at := NOW();
    
    RAISE NOTICE 'Subscription % naturally expired for user %', NEW.dodo_subscription_id, NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically handle natural expiry
DROP TRIGGER IF EXISTS trigger_check_natural_expiry ON public.subscriptions;
CREATE TRIGGER trigger_check_natural_expiry
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_natural_expiry_trigger(); 