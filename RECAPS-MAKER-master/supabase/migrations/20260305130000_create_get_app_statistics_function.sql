-- Create the get_app_statistics function
-- This function returns application statistics from the app_stats table
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
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT 
        total_visitors,
        active_users,
        recaps_created,
        recaps_liked,
        COALESCE(
            (SELECT AVG(rating)::numeric(3,2) 
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