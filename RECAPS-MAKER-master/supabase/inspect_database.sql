-- Inspect existing app_stats relation
SELECT n.nspname AS schema_name,
  c.relname AS relation_name,
  CASE c.relkind
    WHEN 'r' THEN 'table'
    WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized view'
    WHEN 'i' THEN 'index'
    WHEN 'S' THEN 'sequence'
    WHEN 't' THEN 'toast table'
    WHEN 'c' THEN 'composite type'
    ELSE c.relkind
  END AS relation_type,
  pg_catalog.pg_get_userbyid(c.relowner) AS owner,
  pg_catalog.obj_description(c.oid, 'pg_class') AS description
FROM pg_catalog.pg_class c
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'app_stats'
ORDER BY schema_name;

-- Inspect table columns
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' AND 
    table_name = 'app_stats'
ORDER BY 
    ordinal_position;

-- Check existing migrations
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version;