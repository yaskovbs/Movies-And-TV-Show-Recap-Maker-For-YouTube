-- Use IF NOT EXISTS to avoid errors when the table already exists
CREATE TABLE IF NOT EXISTS public.app_stats (
  id BIGINT PRIMARY KEY DEFAULT 1, 
  total_visitors INTEGER DEFAULT 0 NOT NULL,
  active_users INTEGER DEFAULT 0 NOT NULL,
  recaps_created BIGINT DEFAULT 0 NOT NULL, 
  recaps_liked BIGINT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT single_row_constraint CHECK (id = 1)
);

-- Make sure we have a row with id=1 (only inserts if missing)
INSERT INTO public.app_stats (id)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM public.app_stats WHERE id = 1);

-- Enable RLS if not already enabled
ALTER TABLE public.app_stats ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies p 
    JOIN pg_class c ON p.polrelid = c.oid 
    JOIN pg_namespace n ON c.relnamespace = n.oid 
    WHERE p.polname = 'Allow public read access' 
    AND n.nspname = 'public' 
    AND c.relname = 'app_stats'
  ) THEN
    CREATE POLICY "Allow public read access" 
    ON public.app_stats 
    FOR SELECT USING (true);
  END IF;
END
$$;