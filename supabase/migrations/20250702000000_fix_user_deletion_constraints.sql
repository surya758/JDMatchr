-- Fix foreign key constraints to enable proper user deletion
-- This ensures all tables reference public.users instead of auth.users directly

-- Step 1: Drop existing foreign key constraints that reference auth.users directly
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_user_id_fkey;
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_user_id_fkey;

-- Step 2: Add new foreign key constraints that reference public.users
ALTER TABLE jobs 
ADD CONSTRAINT jobs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE candidates 
ADD CONSTRAINT candidates_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 3: Create a function to handle user deletion from auth.users
-- This will be called when a user is deleted from the Supabase Auth dashboard
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete the user from public.users (this will cascade to all related tables)
    DELETE FROM public.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger to handle auth user deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_deletion();

-- Step 5: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_user_deletion() TO service_role;

-- Step 6: Add RLS policy to allow service role to delete users
CREATE POLICY "Service role can delete users" ON public.users
    FOR DELETE USING (auth.role() = 'service_role');

-- Step 7: Add RLS policy to allow service role to delete related data
CREATE POLICY "Service role can delete jobs" ON jobs
    FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete candidates" ON candidates
    FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete subscriptions" ON public.subscriptions
    FOR DELETE USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_user_deletion() IS 'Handles cascading deletion when a user is deleted from auth.users via Supabase dashboard'; 