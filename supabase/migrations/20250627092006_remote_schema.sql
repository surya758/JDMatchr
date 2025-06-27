create table "public"."ip_rate_limits" (
    "id" uuid not null default gen_random_uuid(),
    "ip_address" inet not null,
    "request_count" integer default 1,
    "first_request_at" timestamp with time zone default now(),
    "last_request_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."ip_rate_limits" enable row level security;

CREATE INDEX idx_ip_rate_limits_first_request ON public.ip_rate_limits USING btree (first_request_at);

CREATE UNIQUE INDEX idx_ip_rate_limits_ip ON public.ip_rate_limits USING btree (ip_address);

CREATE UNIQUE INDEX ip_rate_limits_pkey ON public.ip_rate_limits USING btree (id);

alter table "public"."ip_rate_limits" add constraint "ip_rate_limits_pkey" PRIMARY KEY using index "ip_rate_limits_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_ip_rate_limit(user_ip inet)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_record RECORD;
  daily_limit INTEGER := 3;
  result JSON;
BEGIN
  -- Try to get existing record for this IP
  SELECT * INTO current_record 
  FROM ip_rate_limits 
  WHERE ip_address = user_ip;
  
  -- If no record exists, create one
  IF current_record IS NULL THEN
    INSERT INTO ip_rate_limits (ip_address, request_count, first_request_at, last_request_at)
    VALUES (user_ip, 1, NOW(), NOW());
    
    result := json_build_object(
      'allowed', true,
      'requests_used', 1,
      'requests_remaining', daily_limit - 1,
      'reset_time', (NOW() + INTERVAL '1 day')::timestamp
    );
    RETURN result;
  END IF;
  
  -- Check if it's been more than 24 hours since first request
  IF current_record.first_request_at < NOW() - INTERVAL '1 day' THEN
    -- Reset the counter
    UPDATE ip_rate_limits 
    SET request_count = 1,
        first_request_at = NOW(),
        last_request_at = NOW(),
        updated_at = NOW()
    WHERE ip_address = user_ip;
    
    result := json_build_object(
      'allowed', true,
      'requests_used', 1,
      'requests_remaining', daily_limit - 1,
      'reset_time', (NOW() + INTERVAL '1 day')::timestamp
    );
    RETURN result;
  END IF;
  
  -- Check if user has exceeded daily limit
  IF current_record.request_count >= daily_limit THEN
    result := json_build_object(
      'allowed', false,
      'requests_used', current_record.request_count,
      'requests_remaining', 0,
      'reset_time', (current_record.first_request_at + INTERVAL '1 day')::timestamp
    );
    RETURN result;
  END IF;
  
  -- Increment the counter
  UPDATE ip_rate_limits 
  SET request_count = request_count + 1,
      last_request_at = NOW(),
      updated_at = NOW()
  WHERE ip_address = user_ip;
  
  result := json_build_object(
    'allowed', true,
    'requests_used', current_record.request_count + 1,
    'requests_remaining', daily_limit - (current_record.request_count + 1),
    'reset_time', (current_record.first_request_at + INTERVAL '1 day')::timestamp
  );
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_ip_limits()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete records older than 2 days
  DELETE FROM ip_rate_limits 
  WHERE first_request_at < NOW() - INTERVAL '2 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$
;

grant delete on table "public"."ip_rate_limits" to "anon";

grant insert on table "public"."ip_rate_limits" to "anon";

grant references on table "public"."ip_rate_limits" to "anon";

grant select on table "public"."ip_rate_limits" to "anon";

grant trigger on table "public"."ip_rate_limits" to "anon";

grant truncate on table "public"."ip_rate_limits" to "anon";

grant update on table "public"."ip_rate_limits" to "anon";

grant delete on table "public"."ip_rate_limits" to "authenticated";

grant insert on table "public"."ip_rate_limits" to "authenticated";

grant references on table "public"."ip_rate_limits" to "authenticated";

grant select on table "public"."ip_rate_limits" to "authenticated";

grant trigger on table "public"."ip_rate_limits" to "authenticated";

grant truncate on table "public"."ip_rate_limits" to "authenticated";

grant update on table "public"."ip_rate_limits" to "authenticated";

grant delete on table "public"."ip_rate_limits" to "service_role";

grant insert on table "public"."ip_rate_limits" to "service_role";

grant references on table "public"."ip_rate_limits" to "service_role";

grant select on table "public"."ip_rate_limits" to "service_role";

grant trigger on table "public"."ip_rate_limits" to "service_role";

grant truncate on table "public"."ip_rate_limits" to "service_role";

grant update on table "public"."ip_rate_limits" to "service_role";

create policy "Service role can manage IP limits"
on "public"."ip_rate_limits"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));



