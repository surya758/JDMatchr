-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL CHECK (plan_name IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  
  -- Billing details
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role can manage all subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Create default free subscription for existing users
INSERT INTO public.subscriptions (user_id, plan_name, status, current_period_start, current_period_end)
SELECT 
  id,
  COALESCE(subscription_status, 'free'),
  'active',
  NOW(),
  NOW() + INTERVAL '1 month'
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.subscriptions);

-- Remove subscription fields from users table (cleanup)
ALTER TABLE public.users 
DROP COLUMN IF EXISTS subscription_status;

-- Add comments for documentation
COMMENT ON TABLE public.subscriptions IS 'User subscription information and billing details';
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'Whether subscription should cancel at the end of current period';
COMMENT ON COLUMN public.subscriptions.current_period_end IS 'When the current subscription period ends';
COMMENT ON COLUMN public.subscriptions.status IS 'Current subscription status: active, cancelled, expired, past_due'; 