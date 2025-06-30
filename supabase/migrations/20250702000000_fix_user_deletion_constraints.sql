-- Fix foreign key constraints to enable proper user deletion
-- This ensures all tables reference public.users instead of auth.users directly
-- and that deletion cascades properly through the entire chain

-- Step 1: Drop ALL existing foreign key constraints that reference auth.users or public.users
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_user_id_fkey;
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_user_id_fkey;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- Step 2: Ensure public.users has proper cascade from auth.users
-- Drop the existing constraint and recreate it with proper CASCADE
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users 
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Add new foreign key constraints that reference public.users with CASCADE
ALTER TABLE jobs 
ADD CONSTRAINT jobs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE candidates 
ADD CONSTRAINT candidates_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 4: Drop the old trigger function and recreate it with better error handling
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_deletion();

-- Create improved function to handle user deletion from auth.users
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion attempt
    RAISE NOTICE 'Handling deletion of auth user: %', OLD.id;
    
    -- The CASCADE constraint on public.users should automatically handle
    -- the deletion of the user record and all related data
    -- We don't need to manually delete anything here since CASCADE will handle it
    
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't prevent the auth user deletion
        RAISE WARNING 'Error in handle_user_deletion for user %: %', OLD.id, SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger to handle auth user deletion
CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_deletion();

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_user_deletion() TO service_role;

-- Step 7: Update RLS policies to ensure service role can delete everything
DROP POLICY IF EXISTS "Service role can delete users" ON public.users;
CREATE POLICY "Service role can delete users" ON public.users
    FOR DELETE USING (true); -- Allow service role to delete any user

DROP POLICY IF EXISTS "Service role can delete jobs" ON jobs;
CREATE POLICY "Service role can delete jobs" ON jobs
    FOR DELETE USING (true); -- Allow service role to delete any job

DROP POLICY IF EXISTS "Service role can delete candidates" ON candidates;
CREATE POLICY "Service role can delete candidates" ON candidates
    FOR DELETE USING (true); -- Allow service role to delete any candidate

DROP POLICY IF EXISTS "Service role can delete subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can delete subscriptions" ON public.subscriptions
    FOR DELETE USING (true); -- Allow service role to delete any subscription

DROP POLICY IF EXISTS "Service role can delete user_preferences" ON public.user_preferences;
CREATE POLICY "Service role can delete user_preferences" ON public.user_preferences
    FOR DELETE USING (true); -- Allow service role to delete any user preferences

DROP POLICY IF EXISTS "Service role can delete job_applications" ON job_applications;
CREATE POLICY "Service role can delete job_applications" ON job_applications
    FOR DELETE USING (true); -- Allow service role to delete any job application

-- Step 8: Add comment for documentation
COMMENT ON FUNCTION public.handle_user_deletion() IS 'Handles cascading deletion when a user is deleted from auth.users via Supabase dashboard. CASCADE constraints handle the actual deletion.';

-- Step 9: Test the cascade chain by creating a test function (for debugging)
CREATE OR REPLACE FUNCTION public.test_user_deletion_cascade(test_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_exists BOOLEAN;
    jobs_count INTEGER;
    candidates_count INTEGER;
    subscriptions_count INTEGER;
    preferences_count INTEGER;
    applications_count INTEGER;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = test_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN 'User does not exist';
    END IF;
    
    -- Count related records
    SELECT COUNT(*) INTO jobs_count FROM jobs WHERE user_id = test_user_id;
    SELECT COUNT(*) INTO candidates_count FROM candidates WHERE user_id = test_user_id;
    SELECT COUNT(*) INTO subscriptions_count FROM subscriptions WHERE user_id = test_user_id;
    SELECT COUNT(*) INTO preferences_count FROM user_preferences WHERE user_id = test_user_id;
    
    -- Count job applications for user's jobs
    SELECT COUNT(*) INTO applications_count 
    FROM job_applications ja 
    JOIN jobs j ON ja.job_id = j.id 
    WHERE j.user_id = test_user_id;
    
    RETURN format('User %s has: %s jobs, %s candidates, %s subscriptions, %s preferences, %s applications', 
                  test_user_id, jobs_count, candidates_count, subscriptions_count, preferences_count, applications_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.test_user_deletion_cascade(UUID) TO service_role; 