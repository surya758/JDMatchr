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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching job:', error, 'JobId:', jobId, 'UserId:', user.id);
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

/**
 * Update job applications with AI matching results
 */
export async function updateJobApplicationsWithMatchingResults(
  jobId: string,
  rankedCandidates: Array<{
    candidateId: string;
    candidateName: string;
    matchingScore: number;
    ranking: number;
    summary?: string;
    processedResume?: any;
  }>
): Promise<boolean> {
  try {
    // Get all applications for this job
    const { data: applications, error: fetchError } = await supabase
      .from('job_applications')
      .select(`
        id,
        candidate_id,
        candidates (
          id,
          file_name,
          processed_resume
        )
      `)
      .eq('job_id', jobId);

    if (fetchError) {
      console.error('Error fetching applications:', fetchError);
      return false;
    }

    if (!applications || applications.length === 0) {
      console.error('No applications found for job:', jobId);
      return false;
    }

    // Match AI results with database applications
    const updates = [];
    
    for (const application of applications) {
      const candidate = application.candidates;
      if (!candidate) continue;

      // Find matching AI result by comparing candidate name or file name
      const matchingResult = rankedCandidates.find(result => {
        // Try to extract name from processed resume
        let candidateName = '';
        try {
          const resume = typeof candidate.processed_resume === 'string' 
            ? JSON.parse(candidate.processed_resume)
            : candidate.processed_resume;
          candidateName = resume?.personalInfo?.name || '';
        } catch {
          candidateName = '';
        }

        // Match by name or file name
        return result.candidateName === candidateName ||
               result.candidateId === candidate.file_name ||
               result.candidateId.includes(candidate.file_name) ||
               candidate.file_name.includes(result.candidateId);
      });

      // Add update with either matching result or default values
      updates.push({
        applicationId: application.id,
        matchingScore: matchingResult ? matchingResult.matchingScore : 0,
        ranking: matchingResult ? matchingResult.ranking : 999, // Default ranking for unmatched files
        status: 'under_review' as const
      });
    }

    // Batch update all applications
    const updatePromises = updates.map(({ applicationId, matchingScore, ranking, status }) =>
      supabase
        .from('job_applications')
        .update({ 
          matching_score: matchingScore,
          ranking: ranking,
          status: status,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId)
    );

    const results = await Promise.all(updatePromises);
    
    // Check if any updates failed
    const hasErrors = results.some(result => result.error);
    if (hasErrors) {
      console.error('Some application updates failed:', results.filter(r => r.error));
      return false;
    }

    console.log(`Successfully updated ${updates.length} job applications with matching results`);
    return true;

  } catch (error) {
    console.error('Error in updateJobApplicationsWithMatchingResults:', error);
    return false;
  }
}

/**
 * Mark job as completed after successful analysis
 */
export async function markJobAsCompleted(jobId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('jobs')
      .update({ 
        status: 'closed',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (error) {
      console.error('Error marking job as completed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markJobAsCompleted:', error);
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

/**
 * Get all user jobs with summary statistics for reports page
 */
export async function getUserJobReports() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get all user jobs with candidate and application counts
    const { data: jobsWithStats, error } = await supabase
      .from('jobs')
      .select(`
        *,
        candidates (
          id,
          file_name,
          file_url,
          file_path,
          processed_resume
        ),
        job_applications (
          id,
          candidate_id,
          matching_score,
          ranking,
          status
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user job reports:', error);
      return [];
    }

    // Transform the data to include summary statistics
    const reports = jobsWithStats?.map(job => {
      const candidates = job.candidates || [];
      const applications = job.job_applications || [];
      
      // Calculate statistics
      const candidatesAnalyzed = candidates.length;
      const completedApplications = applications.filter(app => app.matching_score !== null);
      const averageScore = completedApplications.length > 0
        ? completedApplications.reduce((sum, app) => sum + (app.matching_score || 0), 0) / completedApplications.length
        : 0;
      
      // Find top match (highest scoring candidate)
      const topApplication = applications
        .filter(app => app.matching_score !== null)
        .sort((a, b) => (b.matching_score || 0) - (a.matching_score || 0))[0];
      
      const topCandidate = topApplication 
        ? candidates.find(c => c.id === topApplication.candidate_id)
        : null;
      
      // Get top candidate name from processed resume
      const topCandidateName = (() => {
        if (!topCandidate?.processed_resume) return "Unknown Candidate";
        
        try {
          const resume = typeof topCandidate.processed_resume === 'string' 
            ? JSON.parse(topCandidate.processed_resume)
            : topCandidate.processed_resume;
          
          return resume?.personalInfo?.name || 
                 resume?.name || 
                 topCandidate.file_name?.replace(/\.[^/.]+$/, "") || // Remove file extension
                 "Unknown Candidate";
        } catch {
          return topCandidate.file_name?.replace(/\.[^/.]+$/, "") || "Unknown Candidate";
        }
      })();

      // Determine status
      let status: 'completed' | 'processing' | 'failed' = 'completed';
      if (candidatesAnalyzed === 0) {
        status = 'failed';
      } else if (completedApplications.length < candidatesAnalyzed) {
        status = 'processing';
      }


      return {
        id: job.id,
        jobTitle: job.title,
        company: job.company || '',
        date: job.created_at,
        candidatesAnalyzed,
        topMatch: topCandidateName,
        topCandidateFileUrl: topCandidate?.file_url || null,
        topCandidateFilePath: topCandidate?.file_path || null,
        topCandidateFileName: topCandidate?.file_name || null,
        matchScore: Math.round(topApplication?.matching_score || 0),
        averageScore: Math.round(averageScore),
        status,
        rawDescription: job.raw_description,
        formattedJd: job.formatted_jd
      };
    }) || [];

    return reports;
  } catch (error) {
    console.error('Error in getUserJobReports:', error);
    return [];
  }
}

/**
 * Get dashboard statistics for the overview page
 */
export async function getDashboardStats() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get all user jobs with candidates and applications
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        candidates (
          id,
          file_name,
          processed_resume,
          upload_date
        ),
        job_applications (
          id,
          matching_score,
          status,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      return null;
    }

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    // Calculate statistics
    const totalReports = jobs?.length || 0;
    const recentAnalyses = jobs?.filter(job => 
      new Date(job.created_at) >= currentMonth
    ).length || 0;

    // Calculate success rate (average match score across all completed applications)
    const allApplications = jobs?.flatMap(job => job.job_applications || []) || [];
    const completedApplications = allApplications.filter(app => app.matching_score !== null);
    const averageMatchScore = completedApplications.length > 0
      ? completedApplications.reduce((sum, app) => sum + (app.matching_score || 0), 0) / completedApplications.length
      : 0;

    // Get recent activity (last 3 jobs with details)
    const recentActivity = jobs?.slice(0, 3).map(job => {
      const candidates = job.candidates || [];
      const applications = job.job_applications || [];
      const completedApps = applications.filter(app => app.matching_score !== null);
      
      // Determine status
      let status: 'completed' | 'processing' | 'failed' = 'completed';
      if (candidates.length === 0) {
        status = 'failed';
      } else if (completedApps.length < candidates.length) {
        status = 'processing';
      }

      return {
        id: job.id,
        title: job.title,
        company: job.company || '',
        candidatesCount: candidates.length,
        date: job.created_at,
        status,
        topScore: completedApps.length > 0 
          ? Math.max(...completedApps.map(app => app.matching_score || 0))
          : 0
      };
    }) || [];

    return {
      totalReports,
      recentAnalyses,
      averageMatchScore: Math.round(averageMatchScore),
      recentActivity,
      totalCandidatesProcessed: jobs?.reduce((sum, job) => sum + (job.candidates?.length || 0), 0) || 0
    };
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return null;
  }
} 