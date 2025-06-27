-- Create job_applications table (junction table with additional data)
CREATE TABLE job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  matching_score DECIMAL(5,2) CHECK (matching_score >= 0 AND matching_score <= 100),
  ranking INTEGER,
  hr_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'rejected', 'interviewed', 'hired')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of job and candidate
  UNIQUE(job_id, candidate_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_candidate_id ON job_applications(candidate_id);
CREATE INDEX idx_job_applications_matching_score ON job_applications(matching_score DESC);
CREATE INDEX idx_job_applications_ranking ON job_applications(job_id, ranking);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_job_score ON job_applications(job_id, matching_score DESC);

-- Enable Row Level Security
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_applications table
CREATE POLICY "Users can view applications for their own jobs" ON job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_applications.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert applications for their own jobs" ON job_applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_applications.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update applications for their own jobs" ON job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_applications.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete applications for their own jobs" ON job_applications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_applications.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

-- Create updated_at trigger for job_applications
CREATE TRIGGER update_job_applications_updated_at 
  BEFORE UPDATE ON job_applications 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update ranking when matching_score changes
CREATE OR REPLACE FUNCTION update_candidate_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update rankings for all candidates in the same job
  WITH ranked_candidates AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY matching_score DESC, created_at ASC) as new_ranking
    FROM job_applications 
    WHERE job_id = COALESCE(NEW.job_id, OLD.job_id)
    AND matching_score IS NOT NULL
  )
  UPDATE job_applications 
  SET ranking = ranked_candidates.new_ranking
  FROM ranked_candidates 
  WHERE job_applications.id = ranked_candidates.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger to update rankings when scores change
CREATE TRIGGER update_rankings_on_score_change
  AFTER INSERT OR UPDATE OF matching_score OR DELETE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_rankings(); 