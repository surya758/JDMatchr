import { supabase } from './supabase';
import { 
  Job, 
  JobInsert, 
  JobUpdate, 
  Candidate, 
  CandidateInsert, 
  JobApplication, 
  JobApplicationInsert,
  JobApplicationUpdate,
  JobStatus,
  ApplicationStatus 
} from '@/types/database';
import { ProcessedResume } from '@/types/resume';

// ============================================================================
// JOB OPERATIONS
// ============================================================================

/**
 * Create a new job
 */
export async function createJob(jobData: Omit<JobInsert, 'user_id'>): Promise<Job | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        ...jobData,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createJob:', error);
    return null;
  }
}

/**
 * Get all jobs for the current user
 */
export async function getUserJobs(status?: JobStatus): Promise<Job[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user jobs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserJobs:', error);
    return [];
  }
}

/**
 * Get a specific job by ID
 */
export async function getJobById(jobId: string): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Error fetching job:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getJobById:', error);
    return null;
  }
}

/**
 * Update a job
 */
export async function updateJob(jobId: string, updates: JobUpdate): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Error updating job:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateJob:', error);
    return null;
  }
}

/**
 * Delete a job (cascades to candidates and applications)
 */
export async function deleteJob(jobId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      console.error('Error deleting job:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteJob:', error);
    return false;
  }
}

// ============================================================================
// CANDIDATE OPERATIONS
// ============================================================================

/**
 * Create a new candidate
 */
export async function createCandidate(candidateData: Omit<CandidateInsert, 'user_id'>): Promise<Candidate | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('candidates')
      .insert({
        ...candidateData,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating candidate:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createCandidate:', error);
    return null;
  }
}

/**
 * Get all candidates for a specific job
 */
export async function getJobCandidates(jobId: string): Promise<Candidate[]> {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('job_id', jobId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching job candidates:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getJobCandidates:', error);
    return [];
  }
}

/**
 * Get candidates with their application data (includes ranking and scores)
 */
export async function getJobCandidatesWithApplications(jobId: string) {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select(`
        *,
        job_applications (
          id,
          matching_score,
          ranking,
          hr_notes,
          status,
          reviewed_at,
          created_at,
          updated_at
        )
      `)
      .eq('job_id', jobId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching candidates with applications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getJobCandidatesWithApplications:', error);
    return [];
  }
}

// ============================================================================
// JOB APPLICATION OPERATIONS
// ============================================================================

/**
 * Create a job application (link candidate to job with initial data)
 */
export async function createJobApplication(applicationData: JobApplicationInsert): Promise<JobApplication | null> {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .insert(applicationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating job application:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createJobApplication:', error);
    return null;
  }
}

/**
 * Update job application (scores, notes, status)
 */
export async function updateJobApplication(
  applicationId: string, 
  updates: JobApplicationUpdate
): Promise<JobApplication | null> {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating job application:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateJobApplication:', error);
    return null;
  }
}

/**
 * Get ranked candidates for a job (ordered by ranking/score)
 */
export async function getRankedCandidates(jobId: string) {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        candidates (
          id,
          file_name,
          file_type,
          file_url,
          file_path,
          processed_resume,
          upload_date
        )
      `)
      .eq('job_id', jobId)
      .order('ranking', { ascending: true })
      .order('matching_score', { ascending: false });

    if (error) {
      console.error('Error fetching ranked candidates:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRankedCandidates:', error);
    return [];
  }
}

/**
 * Update matching scores for multiple candidates (batch operation)
 */
export async function updateMatchingScores(
  updates: Array<{ applicationId: string; matchingScore: number }>
): Promise<boolean> {
  try {
    // Use Promise.all for batch updates
    const updatePromises = updates.map(({ applicationId, matchingScore }) =>
      supabase
        .from('job_applications')
        .update({ matching_score: matchingScore })
        .eq('id', applicationId)
    );

    const results = await Promise.all(updatePromises);
    
    // Check if any updates failed
    const hasErrors = results.some(result => result.error);
    if (hasErrors) {
      console.error('Some score updates failed');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateMatchingScores:', error);
    return false;
  }
}

// ============================================================================
// COMBINED OPERATIONS
// ============================================================================

/**
 * Complete workflow: Create candidates and job applications from processed resumes
 */
export async function createCandidatesFromResumes(
  jobId: string,
  processedResumes: Array<{
    fileName: string;
    fileType: string;
    fileUrl?: string;
    filePath?: string;
    fileSize?: number;
    processedResume: ProcessedResume;
  }>
): Promise<{ candidates: Candidate[]; applications: JobApplication[] }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const candidates: Candidate[] = [];
    const applications: JobApplication[] = [];

    // Create candidates and applications sequentially to maintain relationships
    for (const resume of processedResumes) {
      // Create candidate
      const candidate = await createCandidate({
        job_id: jobId,
        file_name: resume.fileName,
        file_type: resume.fileType,
        file_url: resume.fileUrl,
        file_path: resume.filePath,
        file_size: resume.fileSize,
        processed_resume: resume.processedResume as any
      });

      if (candidate) {
        candidates.push(candidate);

        // Create job application
        const application = await createJobApplication({
          job_id: jobId,
          candidate_id: candidate.id,
          status: 'pending'
        });

        if (application) {
          applications.push(application);
        }
      }
    }

    return { candidates, applications };
  } catch (error) {
    console.error('Error in createCandidatesFromResumes:', error);
    return { candidates: [], applications: [] };
  }
}

/**
 * Get complete job overview with candidates and applications
 */
export async function getJobOverview(jobId: string) {
  try {
    // Get job details
    const job = await getJobById(jobId);
    if (!job) return null;

    // Get ranked candidates with applications
    const rankedCandidates = await getRankedCandidates(jobId);

    // Calculate summary statistics
    const totalCandidates = rankedCandidates.length;
    const averageScore = rankedCandidates.length > 0
      ? rankedCandidates.reduce((sum, app) => sum + (app.matching_score || 0), 0) / rankedCandidates.length
      : 0;
    
    const statusCounts = rankedCandidates.reduce((counts, app) => {
      counts[app.status as ApplicationStatus] = (counts[app.status as ApplicationStatus] || 0) + 1;
      return counts;
    }, {} as Record<ApplicationStatus, number>);

    return {
      job,
      candidates: rankedCandidates,
      summary: {
        totalCandidates,
        averageScore: Math.round(averageScore * 100) / 100,
        statusCounts
      }
    };
  } catch (error) {
    console.error('Error in getJobOverview:', error);
    return null;
  }
} 