-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.get_app_statistics();

-- Create the get_app_statistics function with STABLE attribute
-- This function should be directly executable from client code
CREATE OR REPLACE FUNCTION public.get_app_statistics()
RETURNS TABLE(
    total_visitors integer,
    active_users integer,
    recaps_created integer,
    recaps_liked integer,
    average_rating numeric(3,2),
    total_processing_time integer
) 
LANGUAGE sql
SECURITY DEFINER  -- Change to DEFINER to ensure it works regardless of who calls it
SET search_path = public
STABLE  -- Mark as STABLE since it doesn't modify data
AS $$
    SELECT 
        total_visitors,
        active_users,
        recaps_created,
        recaps_liked,
        COALESCE(
            (SELECT ROUND(AVG(rating)::numeric, 2)
             FROM public.generated_recaps 
             WHERE rating IS NOT NULL), 
            0.00
        ) as average_rating,
        COALESCE(
            (SELECT SUM(processing_time)::integer
             FROM public.generated_recaps 
             WHERE processing_time IS NOT NULL), 
            0
        ) as total_processing_time
    FROM public.app_stats
    WHERE id = 1;
$$;

-- Explicitly grant execute privileges
GRANT EXECUTE ON FUNCTION public.get_app_statistics() TO anon, authenticated, service_role;

-- Create a view that uses this function for easier access
CREATE OR REPLACE VIEW public.app_statistics_view AS
SELECT * FROM public.get_app_statistics();

-- Grant access to the view
GRANT SELECT ON public.app_statistics_view TO anon, authenticated, service_role;