/*
  # Create Storage Bucket: recaps
  This operation creates a new storage bucket named 'recaps' to store the generated video files. The bucket is marked as public to allow easy access for viewing the videos.

  ## Query Description:
  - This is a structural change and is safe to run on a new or existing project.
  - It creates a new storage location. It does not affect any existing data.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the bucket can be deleted)

  ## Security Implications:
  - The bucket is public, meaning anyone with the link can view the files. This is intended for the gallery feature.
  - Write access will be controlled by RLS policies.
*/
INSERT INTO storage.buckets (id, name, public)
VALUES ('recaps', 'recaps', true)
ON CONFLICT (id) DO NOTHING;


/*
  # Create Table: generated_recaps
  This operation creates a new table to store metadata about each generated video recap, including the script, a path to the video file in storage, and the user's original description.

  ## Query Description:
  - This is a structural change and is safe to run.
  - It adds a new table `generated_recaps` for storing application data.
  - It will not affect any existing tables or data.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the table can be dropped)

  ## Structure Details:
  - id: Unique identifier for the recap.
  - created_at: Timestamp of when the recap was created.
  - script: The AI-generated script.
  - video_path: The path to the video file in the 'recaps' storage bucket.
  - description: The user-provided description.
  - visitor_id: An anonymous identifier for the user who created the recap.
*/
CREATE TABLE IF NOT EXISTS public.generated_recaps (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    script text NOT NULL,
    video_path text NOT NULL,
    description text,
    visitor_id text,
    CONSTRAINT generated_recaps_pkey PRIMARY KEY (id)
);


/*
  # Enable RLS: generated_recaps
  This operation enables Row Level Security on the `generated_recaps` table. This is a critical security step that ensures data access is governed by the policies we define next. By default, it denies all access until a policy explicitly grants it.

  ## Query Description:
  - This is a security-hardening step.
  - It does not modify data but restricts access to it.
  - It is safe and recommended to run.
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true (RLS can be disabled)

  ## Security Implications:
  - RLS Status: Enabled
  - This is the foundation for securing the table's data.
*/
ALTER TABLE public.generated_recaps ENABLE ROW LEVEL SECURITY;


/*
  # Create RLS Policy: Allow public read access
  This policy allows anyone (anonymous and authenticated users) to view all records in the `generated_recaps` table. This is necessary for the public gallery feature.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the policy can be dropped)
*/
CREATE POLICY "Allow public read access on generated_recaps"
ON public.generated_recaps
FOR SELECT
TO anon, authenticated
USING (true);

/*
  # Create RLS Policy: Allow anonymous inserts
  This policy allows anyone (anonymous and authenticated users) to insert new records into the `generated_recaps` table. This is required for the main functionality of creating and saving a new recap.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true (the policy can be dropped)
*/
CREATE POLICY "Allow anonymous inserts on generated_recaps"
ON public.generated_recaps
FOR INSERT
TO anon, authenticated
WITH CHECK (true);


/*
  # Create Storage Policy: Allow public read access to recaps
  This policy allows anyone to view and download files from the 'recaps' bucket. This is essential for the video player in the gallery to work.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the policy can be dropped)
*/
CREATE POLICY "Allow public read access on recaps bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'recaps');


/*
  # Create Storage Policy: Allow anonymous uploads to recaps
  This policy allows anyone to upload new files to the 'recaps' bucket. This is required for the application to save the generated video files.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true (the policy can be dropped)
*/
CREATE POLICY "Allow anonymous uploads on recaps bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'recaps');
