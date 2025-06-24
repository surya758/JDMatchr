-- Add missing INSERT policy for subscriptions table
-- This was causing 403 errors when users tried to upgrade their subscription
CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON POLICY "Users can insert their own subscriptions" ON public.subscriptions IS 'Allows authenticated users to create subscriptions for themselves when upgrading plans'; 