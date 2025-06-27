-- Remove IP rate limiting functionality completely

-- Drop the database functions
DROP FUNCTION IF EXISTS public.check_ip_rate_limit(inet);
DROP FUNCTION IF EXISTS public.cleanup_old_ip_limits();

-- Drop the table (this will also drop all indexes and constraints)
DROP TABLE IF EXISTS public.ip_rate_limits CASCADE; 