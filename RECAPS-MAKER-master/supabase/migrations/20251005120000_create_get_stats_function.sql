/*
  # [Function] get_app_statistics
  Creates a PostgreSQL function to securely fetch all public application statistics in a single call.

  ## Query Description:
  This function consolidates multiple queries into one, improving performance and simplifying security management. It fetches data from `app_stats` and `unique_visitors`. Since it runs with `SECURITY DEFINER` privileges, it can bypass Row-Level Security policies on these tables, ensuring that the public stats are always readable. This is a safe operation as it only reads and aggregates public data.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the function can be dropped)

  ## Structure Details:
  - Function: `public.get_app_statistics()`
  - Returns: JSON object with keys: `recaps_created`, `total_rating_sum`, `rating_count`, `active_users`.

  ## Security Implications:
  - RLS Status: This function is designed to work with RLS by using `SECURITY DEFINER`.
  - Policy Changes: No.
  - Auth Requirements: The function is callable by the `anon` role.

  ## Performance Impact:
  - Indexes: Relies on existing table indexes.
  - Triggers: No.
  - Estimated Impact: Low. Consolidates queries, which may slightly improve performance.
*/

create or replace function public.get_app_statistics()
returns json
language plpgsql
security definer
as $$
declare
  stats_data record;
  visitors_count bigint;
begin
  -- Fetch stats from app_stats table
  select recaps_created, total_rating_sum, rating_count
  into stats_data
  from public.app_stats
  limit 1;

  -- Fetch count from unique_visitors table
  select count(*)
  into visitors_count
  from public.unique_visitors;

  -- Return as a single JSON object
  return json_build_object(
    'recaps_created', stats_data.recaps_created,
    'total_rating_sum', stats_data.total_rating_sum,
    'rating_count', stats_data.rating_count,
    'active_users', visitors_count
  );
end;
$$;

-- Grant execute permission to the anonymous role
grant execute on function public.get_app_statistics() to anon;
