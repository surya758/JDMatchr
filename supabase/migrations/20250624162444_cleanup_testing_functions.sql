-- Remove testing functions that are no longer needed
DROP FUNCTION IF EXISTS expire_subscription_for_testing(UUID);

-- Keep the process_expired_subscriptions function but remove testing grants
-- Revoke execute permission from authenticated users (only service role should use it)
REVOKE EXECUTE ON FUNCTION process_expired_subscriptions() FROM authenticated;

-- Add comment to clarify this is now for automated processing only
COMMENT ON FUNCTION process_expired_subscriptions() IS 'Processes expired subscriptions and downgrades users to free plan - Used by automated Edge Function'; 