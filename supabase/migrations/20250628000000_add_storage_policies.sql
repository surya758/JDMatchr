-- Add storage policies for resume-files bucket
-- This fixes the 403 Unauthorized error when uploading files

-- Policy for authenticated users to upload files to their own folder
CREATE POLICY "Users can upload files to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resume-files' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for authenticated users to view files in their own folder
CREATE POLICY "Users can view files in their own folder" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resume-files' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for authenticated users to update files in their own folder
CREATE POLICY "Users can update files in their own folder" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'resume-files' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for authenticated users to delete files in their own folder
CREATE POLICY "Users can delete files in their own folder" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resume-files' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
); 