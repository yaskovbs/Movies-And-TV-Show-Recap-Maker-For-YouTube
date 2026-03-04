/*
          # [Secure Statistics Function]
          Sets a fixed `search_path` for the `get_app_statistics` function to prevent potential security vulnerabilities related to search path hijacking. This ensures the function only looks for tables and other objects within the `public` schema, improving security and predictability.

          ## Query Description: [This operation modifies an existing database function to enhance security. It sets a fixed search path, which is a best practice to prevent certain types of attacks. There is no risk to existing data, and the change is fully reversible.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Function: `public.get_app_statistics`
          
          ## Security Implications:
          - RLS Status: Not Applicable
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible performance impact.
          */

ALTER FUNCTION public.get_app_statistics() SET search_path = public;
