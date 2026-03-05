-- Increase Supabase Storage file size limit to 3GB

-- Update recaps bucket with 3GB file size limit
UPDATE storage.buckets
SET 
  file_size_limit = 3221225472, -- 3GB in bytes (3 * 1024 * 1024 * 1024)
  allowed_mime_types = '{video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,image/jpeg,image/png,image/gif}'
WHERE name = 'recaps';

-- Add comment explaining the storage limit increase
COMMENT ON TABLE storage.buckets IS 'Storage buckets configuration updated on March 5, 2026:
- recaps bucket: Increased file size limit to 3GB to accommodate larger videos
- Allowed file types include standard video, audio, and image formats';

-- Note: If the above update fails due to Supabase plan limitations, you may need to:
-- 1. Upgrade your Supabase subscription for increased storage limits
-- 2. Contact Supabase support to request special allowances
-- 3. Consider chunking large files on the client-side into smaller segments