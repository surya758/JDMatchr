-- Create candidates table for storing processed resume data
CREATE TABLE candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT, -- URL to file in Supabase Storage
  file_path TEXT, -- Path in storage bucket for signed URLs
  file_size INTEGER,
  processed_resume JSONB NOT NULL, -- All AI-extracted data
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_candidates_user_id ON candidates(user_id);
CREATE INDEX idx_candidates_job_id ON candidates(job_id);
CREATE INDEX idx_candidates_upload_date ON candidates(upload_date DESC);
CREATE INDEX idx_candidates_user_job ON candidates(user_id, job_id);

-- Create GIN index for JSONB queries on processed_resume
CREATE INDEX idx_candidates_processed_resume_gin ON candidates USING GIN (processed_resume);

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for candidates table
CREATE POLICY "Users can view candidates for their own jobs" ON candidates
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = candidates.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert candidates for their own jobs" ON candidates
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = candidates.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update candidates for their own jobs" ON candidates
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = candidates.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete candidates for their own jobs" ON candidates
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = candidates.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

-- Create updated_at trigger for candidates
CREATE TRIGGER update_candidates_updated_at 
  BEFORE UPDATE ON candidates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 