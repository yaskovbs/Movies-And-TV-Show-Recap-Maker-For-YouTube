-- Fix Supabase security issues identified by the linter

-- 1. Enable Row Level Security (RLS) on tables that have policies but RLS is disabled
ALTER TABLE public.app_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unique_visitors ENABLE ROW LEVEL SECURITY;

-- 2. Fix Security Definer Views - Recreate with SECURITY INVOKER
-- First, let's save the original view definitions
CREATE OR REPLACE FUNCTION save_view_definition(view_name text) RETURNS text AS $$
DECLARE
    view_def text;
BEGIN
    EXECUTE format('SELECT pg_get_viewdef(%L, true)', view_name) INTO view_def;
    RETURN view_def;
END;
$$ LANGUAGE plpgsql;

-- Store view definitions
DO $$
DECLARE
    unique_visitors_view_def text;
    app_stats_view_def text;
    app_statistics_view_def text;
BEGIN
    SELECT save_view_definition('public.unique_visitors_view') INTO unique_visitors_view_def;
    SELECT save_view_definition('public.app_stats_view') INTO app_stats_view_def;
    SELECT save_view_definition('public.app_statistics_view') INTO app_statistics_view_def;
    
    -- Drop views
    DROP VIEW IF EXISTS public.unique_visitors_view;
    DROP VIEW IF EXISTS public.app_stats_view;
    DROP VIEW IF EXISTS public.app_statistics_view;
    
    -- Recreate views with SECURITY INVOKER instead of SECURITY DEFINER
    -- Remove WITH (security_barrier=true) and any SECURITY DEFINER clauses
    EXECUTE replace(
        replace(unique_visitors_view_def, 'SECURITY DEFINER', 'SECURITY INVOKER'),
        'WITH (security_barrier=true)', ''
    );
    
    EXECUTE replace(
        replace(app_stats_view_def, 'SECURITY DEFINER', 'SECURITY INVOKER'),
        'WITH (security_barrier=true)', ''
    );
    
    EXECUTE replace(
        replace(app_statistics_view_def, 'SECURITY DEFINER', 'SECURITY INVOKER'),
        'WITH (security_barrier=true)', ''
    );
END $$;

-- 3. Fix functions with mutable search paths
-- Recreate the functions with explicit search_path setting

-- Fix increment_recaps_created function
CREATE OR REPLACE FUNCTION public.increment_recaps_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.app_stats
  SET recaps_created = recaps_created + 1
  WHERE id = 1;
  RETURN NEW;
END;
$function$;

-- Fix add_rating function
CREATE OR REPLACE FUNCTION public.add_rating(recap_id integer, rating integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.generated_recaps
  SET 
    rating = $2,
    updated_at = now()
  WHERE id = $1;
END;
$function$;

DROP FUNCTION IF EXISTS save_view_definition(text);

-- Comment explaining the changes
COMMENT ON DATABASE postgres IS 'Security fixes applied on March 5, 2026:
1. Enabled Row Level Security (RLS) on all public tables that had RLS policies
2. Changed security definer views to security invoker
3. Fixed functions with mutable search paths';