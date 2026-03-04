/*
# [Operation Name]
Fix and Enhance Database Functions

## Query Description:
This script resolves a migration error by safely replacing the `get_public_stats` function. It first drops the existing function before recreating it with an updated structure that includes the `active_users` count. It also addresses security warnings by setting a fixed `search_path` for all functions, preventing potential hijacking vulnerabilities.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: false (but old function can be restored from previous migrations)

## Structure Details:
- Drops and recreates the `get_public_stats` function.
- Recreates `increment_recaps_created` and `add_rating` functions to set a secure search_path.

## Security Implications:
- RLS Status: Enabled on `app_stats` and `unique_visitors`.
- Policy Changes: No
- Auth Requirements: Functions are callable by `anon` and `authenticated` roles.
- **Security Fix**: Sets `search_path = 'public'` for all functions to mitigate CVE-2018-1058 style attacks.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. Function calls are very fast.
*/

-- Drop the conflicting function first to allow recreating it with a new return type.
DROP FUNCTION IF EXISTS public.get_public_stats();

-- Recreate the get_public_stats function to include active_users count.
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(recaps_created bigint, total_rating_sum bigint, rating_count bigint, active_users bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.recaps_created,
    s.total_rating_sum,
    s.rating_count,
    (SELECT count(*) FROM public.unique_visitors) AS active_users
  FROM
    public.app_stats s
  LIMIT 1;
END;
$$;
-- Set a secure search path for the function
ALTER FUNCTION public.get_public_stats() SET search_path = 'public';


-- Recreate other functions to apply the security fix for search_path.

CREATE OR REPLACE FUNCTION public.increment_recaps_created()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.app_stats
  SET recaps_created = recaps_created + 1
  WHERE id = 1;
END;
$$;
ALTER FUNCTION public.increment_recaps_created() SET search_path = 'public';


CREATE OR REPLACE FUNCTION public.add_rating(new_rating integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure rating is between 1 and 5
  IF new_rating >= 1 AND new_rating <= 5 THEN
    UPDATE public.app_stats
    SET
      total_rating_sum = total_rating_sum + new_rating,
      rating_count = rating_count + 1
    WHERE id = 1;
  END IF;
END;
$$;
ALTER FUNCTION public.add_rating(new_rating integer) SET search_path = 'public';

-- Grant usage on the functions to public roles
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_recaps_created() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_rating(new_rating integer) TO anon, authenticated;
