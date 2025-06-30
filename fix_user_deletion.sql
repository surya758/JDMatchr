-- EMERGENCY FIX: User Deletion Cascade Issue
-- Run this in Supabase SQL Editor to fix "Database error deleting user"
-- This script fixes foreign key constraints and RLS policies

BEGIN;

-- Step 1: Fix the cascade chain from auth.users -> public.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users 
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Fix all table constraints to cascade from public.users
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_user_id_fkey;
ALTER TABLE jobs 
ADD CONSTRAINT jobs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_user_id_fkey;
ALTER TABLE candidates 
ADD CONSTRAINT candidates_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;
ALTER TABLE user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 3: Fix RLS policies to allow service role to delete
DROP POLICY IF EXISTS "Service role can delete users" ON public.users;
CREATE POLICY "Service role can delete users" ON public.users FOR DELETE USING (true);

DROP POLICY IF EXISTS "Service role can delete jobs" ON jobs;
CREATE POLICY "Service role can delete jobs" ON jobs FOR DELETE USING (true);

DROP POLICY IF EXISTS "Service role can delete candidates" ON candidates;
CREATE POLICY "Service role can delete candidates" ON candidates FOR DELETE USING (true);

DROP POLICY IF EXISTS "Service role can delete subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can delete subscriptions" ON public.subscriptions FOR DELETE USING (true);

DROP POLICY IF EXISTS "Service role can delete user_preferences" ON public.user_preferences;
CREATE POLICY "Service role can delete user_preferences" ON public.user_preferences FOR DELETE USING (true);

DROP POLICY IF EXISTS "Service role can delete job_applications" ON job_applications;
CREATE POLICY "Service role can delete job_applications" ON job_applications FOR DELETE USING (true);

-- Step 4: Simplify the trigger to avoid issues
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_deletion();

CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'User % deleted from auth.users, CASCADE will handle cleanup', OLD.id;
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in deletion trigger: %', SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_deletion();

GRANT EXECUTE ON FUNCTION public.handle_user_deletion() TO service_role;

COMMIT;

-- Test query to verify the fix (run this separately after the above)
-- SELECT table_name, constraint_name, 
--        CASE WHEN delete_rule = 'CASCADE' THEN '✅ OK' ELSE '❌ NEEDS FIX' END as status
-- FROM information_schema.referential_constraints rc
-- JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
-- WHERE tc.table_schema = 'public' 
--   AND constraint_type = 'FOREIGN KEY'
-- ORDER BY table_name; 