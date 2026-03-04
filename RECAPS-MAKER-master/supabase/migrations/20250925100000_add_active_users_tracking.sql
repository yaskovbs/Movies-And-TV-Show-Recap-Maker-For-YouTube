/*
          # [Operation Name]
          Create Unique Visitors Tracking

          ## Query Description:
          This migration creates a new table `unique_visitors` to track unique visitors to the application. It also creates a new database function `get_public_stats` to efficiently query all application statistics (recaps, ratings, and active users) in a single call. This is a safe, structural change and does not affect existing data.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Creates table: `public.unique_visitors`
          - Creates function: `public.get_public_stats()`

          ## Security Implications:
          - RLS Status: Enabled on the new table.
          - Policy Changes: Adds a new INSERT policy for anonymous users on `unique_visitors`.
          - Auth Requirements: None.

          ## Performance Impact:
          - Indexes: Adds a primary key index on `unique_visitors`.
          - Triggers: None.
          - Estimated Impact: Low. The new function improves query performance by bundling multiple queries into one.
          */

-- 1. Create the table to store unique visitor IDs
CREATE TABLE IF NOT EXISTS public.unique_visitors (
    visitor_id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.unique_visitors ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow anyone to insert their own visitor ID
-- The primary key constraint on visitor_id will prevent duplicates.
CREATE POLICY "Allow anonymous insert"
ON public.unique_visitors
FOR INSERT
TO anon
WITH CHECK (true);

-- 4. Create a function to get all public stats in one call
CREATE OR REPLACE FUNCTION get_public_stats()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  stats_rec RECORD;
  visitor_count BIGINT;
BEGIN
  -- Fetch stats from the app_stats table
  SELECT recaps_created, total_rating_sum, rating_count
  INTO stats_rec
  FROM public.app_stats
  WHERE id = 1;

  -- Count unique visitors
  SELECT count(*)
  INTO visitor_count
  FROM public.unique_visitors;

  -- Build and return a JSON object with all stats
  RETURN json_build_object(
    'recaps_created', stats_rec.recaps_created,
    'total_rating_sum', stats_rec.total_rating_sum,
    'rating_count', stats_rec.rating_count,
    'active_users', visitor_count
  );
END;
$$;
