/*
# [Feature] Add Generated Recaps Storage
This migration sets up the infrastructure to permanently store user-generated video recaps and their corresponding scripts.

## Query Description:
This script performs the following actions:
1.  **Creates a new storage bucket** named `recaps` for storing the MP4 video files. This bucket is made public for easy read access, which is suitable for this application's current structure.
2.  **Creates a new table** `public.generated_recaps` to store metadata about each recap, including the script, a reference to the video file in storage, the user's original description, and the visitor ID for anonymous tracking.
3.  **Enables Row Level Security (RLS)** on the new table to control access.
4.  **Creates RLS policies** that allow anyone to view (`SELECT`) the saved recaps and anyone to insert (`INSERT`) a new recap. This aligns with the current anonymous nature of the application.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (with a corresponding DROP script)

## Structure Details:
- **Storage Bucket Created:** `recaps`
- **Table Created:** `public.generated_recaps`
  - `id` (uuid, pk)
  - `created_at` (timestamptz)
  - `script` (text)
  - `video_path` (text)
  - `description` (text)
  - `visitor_id` (text)

## Security Implications:
- RLS Status: Enabled on `public.generated_recaps`.
- Policy Changes: Yes, new policies are added.
  - `public_read_access`: Allows anyone to view all saved recaps.
  - `public_insert_access`: Allows anyone to save a new recap.
- Auth Requirements: None. The policies apply to the `anon` and `authenticated` roles. This is intentionally open to fit the app's current design but should be revisited if user accounts are added.

## Performance Impact:
- Indexes: A primary key index is automatically created on the `id` column.
- Triggers: None.
- Estimated Impact: Negligible. The table will be small initially. Performance for reads will be excellent.
*/

-- 1. Create a new storage bucket for recaps.
INSERT INTO storage.buckets (id, name, public)
VALUES ('recaps', 'recaps', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the new bucket
-- Allow public read access to all files in the 'recaps' bucket.
CREATE POLICY "Public read access for recaps"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recaps');

-- Allow anyone to upload files to the 'recaps' bucket.
CREATE POLICY "Public insert access for recaps"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'recaps');


-- 2. Create the table to store generated recaps metadata.
CREATE TABLE public.generated_recaps (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    script text NOT NULL,
    video_path text NOT NULL,
    description text,
    visitor_id text,
    CONSTRAINT generated_recaps_pkey PRIMARY KEY (id)
);

-- 3. Enable Row Level Security (RLS) on the new table.
ALTER TABLE public.generated_recaps ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies.
-- Allow public read access to everyone.
CREATE POLICY "Allow public read access"
ON public.generated_recaps
FOR SELECT
TO public
USING (true);

-- Allow anyone to insert new recaps.
CREATE POLICY "Allow public insert access"
ON public.generated_recaps
FOR INSERT
TO public
WITH CHECK (true);
