/*
          # [Operation Name]
          Create Application Statistics Table and Functions

          ## Query Description: [This migration sets up the infrastructure for tracking application-wide statistics. It creates a new table `app_stats` to store counters for created recaps and user ratings. It also creates two functions, `increment_recap_count` and `update_rating`, which allow the application to securely update these statistics without granting direct write access to the table. This operation is safe and does not affect existing data.]

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Creates Table: `public.app_stats`
          - Creates Function: `public.increment_recap_count()`
          - Creates Function: `public.update_rating(new_rating int)`

          ## Security Implications:
          - RLS Status: Enabled on `app_stats`
          - Policy Changes: Yes, adds a new read-only policy for all users.
          - Auth Requirements: The functions can be called by any user (anon or authenticated).

          ## Performance Impact:
          - Indexes: Adds a primary key on the `id` column.
          - Triggers: None
          - Estimated Impact: Negligible performance impact. The table will only ever contain a single row.
          */

-- 1. Create the app_stats table
CREATE TABLE public.app_stats (
    id BIGINT PRIMARY KEY DEFAULT 1,
    recaps_created BIGINT DEFAULT 0 NOT NULL,
    total_ratings BIGINT DEFAULT 0 NOT NULL,
    rating_count BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT single_row_constraint CHECK (id = 1)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.app_stats ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow public read access
CREATE POLICY "Allow public read access"
ON public.app_stats
FOR SELECT
USING (true);

-- 4. Insert the single row for statistics
INSERT INTO public.app_stats (id) VALUES (1);

-- 5. Create a function to increment the recap counter
CREATE OR REPLACE FUNCTION public.increment_recap_count()
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

-- 6. Create a function to update the rating
CREATE OR REPLACE FUNCTION public.update_rating(new_rating INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF new_rating >= 1 AND new_rating <= 5 THEN
    UPDATE public.app_stats
    SET 
      total_ratings = total_ratings + new_rating,
      rating_count = rating_count + 1
    WHERE id = 1;
  END IF;
END;
$$;

-- Grant execution rights to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.increment_recap_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_rating(new_rating INT) TO anon, authenticated;
