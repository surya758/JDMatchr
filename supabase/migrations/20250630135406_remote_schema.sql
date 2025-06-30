drop policy "Service role can delete job_applications" on "public"."job_applications";

drop policy "Service role can delete candidates" on "public"."candidates";

drop policy "Service role can delete jobs" on "public"."jobs";

drop policy "Service role can delete subscriptions" on "public"."subscriptions";

drop policy "Service role can delete user_preferences" on "public"."user_preferences";

drop policy "Service role can delete users" on "public"."users";

drop function if exists "public"."test_user_deletion_cascade"(test_user_id uuid);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_user_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Set the role to service_role to bypass RLS
    SET LOCAL ROLE service_role;
    
    -- Delete from public.users which will cascade to all related tables
    -- due to the ON DELETE CASCADE constraints
    DELETE FROM public.users WHERE id = OLD.id;
    
    -- Reset role
    RESET ROLE;
    
    RETURN OLD;
EXCEPTION WHEN OTHERS THEN
    -- Log the error (will appear in Supabase logs)
    RAISE LOG 'Error in handle_user_deletion for user %: %', OLD.id, SQLERRM;
    RETURN OLD;
END;
$function$
;

create policy "Service role can delete candidates"
on "public"."candidates"
as permissive
for delete
to public
using ((auth.role() = 'service_role'::text));


create policy "Service role can delete jobs"
on "public"."jobs"
as permissive
for delete
to public
using ((auth.role() = 'service_role'::text));


create policy "Service role can delete subscriptions"
on "public"."subscriptions"
as permissive
for delete
to public
using ((auth.role() = 'service_role'::text));


create policy "Service role can delete user_preferences"
on "public"."user_preferences"
as permissive
for delete
to public
using ((auth.role() = 'service_role'::text));


create policy "Service role can delete users"
on "public"."users"
as permissive
for delete
to public
using ((auth.role() = 'service_role'::text));



