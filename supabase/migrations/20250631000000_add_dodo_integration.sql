-- Add Dodo Payments integration fields to subscriptions table
-- This maintains our existing subscription logic while adding Dodo sync capabilities

-- Add Dodo-specific columns
ALTER TABLE public.subscriptions 
ADD COLUMN dodo_subscription_id TEXT UNIQUE,
ADD COLUMN dodo_customer_id TEXT,
ADD COLUMN dodo_product_id TEXT,
ADD COLUMN payment_method_id TEXT,
ADD COLUMN last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN billing_interval TEXT CHECK (billing_interval IN ('monthly', 'yearly', 'one_time')),
ADD COLUMN currency TEXT DEFAULT 'USD',
ADD COLUMN amount_cents INTEGER,
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX idx_subscriptions_dodo_subscription_id ON public.subscriptions(dodo_subscription_id);
CREATE INDEX idx_subscriptions_dodo_customer_id ON public.subscriptions(dodo_customer_id);
CREATE INDEX idx_subscriptions_next_billing_date ON public.subscriptions(next_billing_date);
CREATE INDEX idx_subscriptions_status_billing ON public.subscriptions(status, next_billing_date);

-- Add comments for documentation
COMMENT ON COLUMN public.subscriptions.dodo_subscription_id IS 'Unique identifier from Dodo Payments for this subscription';
COMMENT ON COLUMN public.subscriptions.dodo_customer_id IS 'Dodo Payments customer identifier';
COMMENT ON COLUMN public.subscriptions.dodo_product_id IS 'Dodo Payments product/plan identifier';
COMMENT ON COLUMN public.subscriptions.payment_method_id IS 'Dodo Payments payment method identifier';
COMMENT ON COLUMN public.subscriptions.billing_interval IS 'Billing frequency from Dodo Payments';
COMMENT ON COLUMN public.subscriptions.amount_cents IS 'Subscription amount in cents';
COMMENT ON COLUMN public.subscriptions.metadata IS 'Additional data from Dodo Payments webhooks';

-- Update existing subscriptions to have billing_interval
UPDATE public.subscriptions 
SET billing_interval = 'monthly' 
WHERE billing_interval IS NULL;

-- Function to sync subscription from Dodo webhook data
CREATE OR REPLACE FUNCTION public.sync_dodo_subscription(
  p_user_id UUID,
  p_dodo_subscription_id TEXT,
  p_dodo_customer_id TEXT,
  p_plan_name TEXT,
  p_status TEXT,
  p_current_period_start TIMESTAMP WITH TIME ZONE,
  p_current_period_end TIMESTAMP WITH TIME ZONE,
  p_amount_cents INTEGER DEFAULT NULL,
  p_currency TEXT DEFAULT 'USD',
  p_billing_interval TEXT DEFAULT 'monthly',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  subscription_id UUID;
  credit_amount INTEGER;
BEGIN
  -- Determine credit amount based on plan
  credit_amount := CASE 
    WHEN p_plan_name = 'free' THEN 1
    WHEN p_plan_name = 'pro' THEN 30
    WHEN p_plan_name = 'enterprise' THEN 999
    ELSE 1
  END;

  -- Insert or update subscription
  INSERT INTO public.subscriptions (
    user_id,
    dodo_subscription_id,
    dodo_customer_id,
    plan_name,
    status,
    current_period_start,
    current_period_end,
    job_credits,
    job_credits_used,
    amount_cents,
    currency,
    billing_interval,
    metadata,
    updated_at
  )
  VALUES (
    p_user_id,
    p_dodo_subscription_id,
    p_dodo_customer_id,
    p_plan_name,
    p_status,
    p_current_period_start,
    p_current_period_end,
    credit_amount,
    0, -- Reset credits used on new subscription
    p_amount_cents,
    p_currency,
    p_billing_interval,
    p_metadata,
    NOW()
  )
  ON CONFLICT (dodo_subscription_id) 
  DO UPDATE SET
    plan_name = EXCLUDED.plan_name,
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    job_credits = EXCLUDED.job_credits,
    amount_cents = EXCLUDED.amount_cents,
    currency = EXCLUDED.currency,
    billing_interval = EXCLUDED.billing_interval,
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING id INTO subscription_id;

  RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.sync_dodo_subscription TO service_role;

-- Add RLS policy for service role to manage Dodo sync
CREATE POLICY "Service role can manage Dodo subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Function to create/update local-only subscription (for free plans)
CREATE OR REPLACE FUNCTION public.update_local_subscription(
  p_user_id UUID,
  p_plan_name TEXT,
  p_status TEXT DEFAULT 'active'
)
RETURNS UUID AS $$
DECLARE
  subscription_id UUID;
  credit_amount INTEGER;
BEGIN
  -- Determine credit amount based on plan
  credit_amount := CASE 
    WHEN p_plan_name = 'free' THEN 1
    WHEN p_plan_name = 'pro' THEN 30
    WHEN p_plan_name = 'enterprise' THEN 999
    ELSE 1
  END;

  -- Insert or update subscription (local only, no Dodo fields)
  INSERT INTO public.subscriptions (
    user_id,
    plan_name,
    status,
    current_period_start,
    current_period_end,
    job_credits,
    job_credits_used,
    billing_interval,
    currency,
    updated_at
  )
  VALUES (
    p_user_id,
    p_plan_name,
    p_status,
    NOW(),
    CASE 
      WHEN p_plan_name = 'free' THEN NULL
      ELSE NOW() + INTERVAL '1 month'
    END,
    credit_amount,
    0,
    CASE WHEN p_plan_name = 'free' THEN NULL ELSE 'monthly' END,
    'USD',
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan_name = EXCLUDED.plan_name,
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    job_credits = EXCLUDED.job_credits,
    job_credits_used = 0, -- Reset credits on plan change
    billing_interval = EXCLUDED.billing_interval,
    currency = EXCLUDED.currency,
    updated_at = NOW(),
    -- Clear Dodo fields when switching to local-only plan
    dodo_subscription_id = CASE WHEN EXCLUDED.plan_name = 'free' THEN NULL ELSE dodo_subscription_id END,
    dodo_customer_id = CASE WHEN EXCLUDED.plan_name = 'free' THEN NULL ELSE dodo_customer_id END,
    dodo_product_id = CASE WHEN EXCLUDED.plan_name = 'free' THEN NULL ELSE dodo_product_id END
  RETURNING id INTO subscription_id;

  RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.update_local_subscription TO authenticated, service_role; 