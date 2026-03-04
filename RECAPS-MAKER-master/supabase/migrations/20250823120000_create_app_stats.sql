/*
          # [Operation Name]
          Create App Statistics Table and Functions

          ## Query Description: [This migration sets up the infrastructure for tracking application statistics in real-time. It creates a new table `app_stats` to hold counters and rating aggregates. It also creates two RPC functions, `increment_recaps_created` and `add_rating`, which are the only way to modify the stats, ensuring data integrity. RLS is enabled to allow public read access while restricting writes to the secure functions.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Tables Created: public.app_stats
          - Functions Created: public.increment_recaps_created(), public.add_rating(integer)
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [None for reading, functions are callable by anon role]
          
          ## Performance Impact:
          - Indexes: [Primary Key on `id`]
          - Triggers: [None]
          - Estimated Impact: [Low. The table will only ever contain a single row, so queries will be extremely fast.]
          */

-- 1. Create the table to hold application statistics
CREATE TABLE public.app_stats (
  id smallint PRIMARY KEY DEFAULT 1,
  recaps_created bigint NOT NULL DEFAULT 0,
  total_rating_sum bigint NOT NULL DEFAULT 0,
  rating_count bigint NOT NULL DEFAULT 0,
  CONSTRAINT single_row_constraint CHECK (id = 1)
);

-- 2. Enable Row Level Security
ALTER TABLE public.app_stats ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow public read access
CREATE POLICY "Allow public read access" ON public.app_stats
  FOR SELECT USING (true);

-- 4. Insert the initial single row of data
INSERT INTO public.app_stats (id, recaps_created, total_rating_sum, rating_count)
VALUES (1, 0, 0, 0);

-- 5. Create a function to increment the recaps_created count
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

-- 6. Create a function to add a new rating
CREATE OR REPLACE FUNCTION public.add_rating(new_rating integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure rating is between 1 and 5
  IF new_rating < 1 OR new_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  UPDATE public.app_stats
  SET 
    total_rating_sum = total_rating_sum + new_rating,
    rating_count = rating_count + 1
  WHERE id = 1;
END;
$$;

-- Grant execution rights to the anon role so it can be called from the frontend
GRANT EXECUTE ON FUNCTION public.increment_recaps_created() TO anon;
GRANT EXECUTE ON FUNCTION public.add_rating(integer) TO anon;
