/*
          # [Operation Name] Visitor Tracking and Security Fixes
          [This operation adds a table to track unique visitors and fixes security warnings for existing functions.]

          ## Query Description: [This operation is safe. It adds a new table `unique_visitors` to count active users and updates existing database functions to improve security by setting a fixed `search_path`. This resolves the "Function Search Path Mutable" warnings. No existing data will be modified or deleted.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Adds table: `public.unique_visitors`
          - Modifies functions: `get_public_stats`, `increment_recaps_created`, `add_rating`
          
          ## Security Implications:
          - RLS Status: [Enabled on new table]
          - Policy Changes: [Yes, adds policies for the new table]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [Adds a primary key index on the new table]
          - Triggers: [No]
          - Estimated Impact: [Negligible performance impact.]
          */

-- 1. Create a table to store unique visitor IDs
CREATE TABLE IF NOT EXISTS public.unique_visitors (
    visitor_id uuid PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Enable RLS on the new table
ALTER TABLE public.unique_visitors ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for the new table
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.unique_visitors;
CREATE POLICY "Allow anonymous insert" ON public.unique_visitors FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read" ON public.unique_visitors;
CREATE POLICY "Allow anonymous read" ON public.unique_visitors FOR SELECT
USING (true);


-- 4. Update get_public_stats to include active users and fix search_path
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE (
    recaps_created bigint,
    total_rating_sum bigint,
    rating_count bigint,
    active_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Fix for "Function Search Path Mutable" warning
    SET search_path = 'public';

    RETURN QUERY
    SELECT
        s.recaps_created,
        s.total_rating_sum,
        s.rating_count,
        (SELECT count(*) FROM public.unique_visitors) as active_users
    FROM public.app_stats s
    LIMIT 1;
END;
$$;


-- 5. Update increment_recaps_created to fix search_path
CREATE OR REPLACE FUNCTION public.increment_recaps_created()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    SET search_path = 'public';
    UPDATE public.app_stats SET recaps_created = recaps_created + 1;
END;
$$;


-- 6. Update add_rating to fix search_path
CREATE OR REPLACE FUNCTION public.add_rating(new_rating integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    SET search_path = 'public';
    UPDATE public.app_stats
    SET
        total_rating_sum = total_rating_sum + new_rating,
        rating_count = rating_count + 1;
END;
$$;
