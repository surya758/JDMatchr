-- Create storage bucket for resume files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resume-files',
  'resume-files',
  false, -- Private bucket
  52428800, -- 50MB limit per file
  ARRAY[
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
);

-- Storage policies will be created via Supabase dashboard or client SDK
-- The bucket is created as private, so only authenticated users with proper policies can access files 