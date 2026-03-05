-- Configure Supabase Storage Buckets for Recaps

-- Create recaps bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'recaps'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('recaps', 'recaps', true, 104857600, '{video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,image/jpeg,image/png,image/gif}');
    -- 104857600 bytes = 100 MB file size limit
  ELSE
    -- Update existing bucket configuration
    UPDATE storage.buckets
    SET 
      public = true,
      file_size_limit = 104857600, -- 100 MB
      allowed_mime_types = '{video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,image/jpeg,image/png,image/gif}'
    WHERE name = 'recaps';
  END IF;
END
$$;

-- Create storage policies for the recaps bucket
-- Allow anyone to read from the recaps bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'recaps' AND name = 'Public Read Access'
  ) THEN
    INSERT INTO storage.policies (bucket_id, name, definition, actions)
    VALUES ('recaps', 'Public Read Access', 
      'true', -- Public access to read files
      '{SELECT}'
    );
  END IF;

  -- Allow authenticated users to upload to the recaps bucket
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'recaps' AND name = 'Authenticated Users Upload Access'
  ) THEN
    INSERT INTO storage.policies (bucket_id, name, definition, actions)
    VALUES ('recaps', 'Authenticated Users Upload Access', 
      'auth.role() = ''authenticated''', -- Only authenticated users
      '{INSERT,UPDATE}'
    );
  END IF;

  -- Allow users to delete their own uploads
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'recaps' AND name = 'Owner Delete Access'
  ) THEN
    INSERT INTO storage.policies (bucket_id, name, definition, actions)
    VALUES ('recaps', 'Owner Delete Access', 
      'auth.uid() = owner', -- Only the owner can delete
      '{DELETE}'
    );
  END IF;
END
$$;

-- Add comment explaining the storage configuration
COMMENT ON TABLE storage.buckets IS 'Storage buckets configuration updated on March 5, 2026:
- recaps bucket: 100MB file size limit, public access for reading, authenticated users can upload';