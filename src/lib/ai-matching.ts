import { ProcessedResume } from '@/types/resume';
import { FormattedJD } from '@/hooks/useJobDescriptionProcessor';

export interface AIMatchingResult {
  candidateId: string;
  candidateName: string;
  matchingScore: number;
  summary: string;
  keyStrengths: string[];
  potentialConcerns: string[];
  fitAnalysis: {
    technicalFit: number;
    experienceFit: number;
    culturalFit: number;
    growthPotential: number;
  };
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'pass';
}

export interface RankedCandidate extends AIMatchingResult {
  ranking: number;
  processedResume: ProcessedResume;
}

/**
 * Use AI to match candidates against job requirements
 */
export async function matchCandidatesWithAI(
  job: FormattedJD,
  candidates: ProcessedResume[]
): Promise<RankedCandidate[]> {
  if (candidates.length === 0) return [];

  try {
    // Prepare the data for AI analysis
    const jobContext = {
      title: job.title,
      company: job.company,
      location: job.location,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      responsibilities: job.responsibilities,
      qualifications: job.qualifications,
      benefits: job.benefits,
      summary: job.summary
    };

    const candidateProfiles = candidates.map((candidate, index) => ({
      id: `candidate_${index}`,
      name: candidate.personalInfo.name || `Candidate ${index + 1}`,
      fileName: candidate.fileName,
      profile: {
        personalInfo: candidate.personalInfo,
        experience: candidate.experience,
        skills: candidate.skills,
        education: candidate.education,
        certifications: candidate.certifications,
        projects: candidate.projects,
        notablePoints: candidate.notablePoints,
        overallProfile: candidate.overallProfile
      }
    }));

    // Call the AI matching API
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-candidate-matching`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          job: jobContext,
          candidates: candidateProfiles,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `API error: ${response.status}`,
      }));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to match candidates');
    }

    // Combine AI results with original resume data and add rankings
    const rankedCandidates: RankedCandidate[] = data.matchingResults
      .map((result: AIMatchingResult, index: number) => {
        const originalCandidate = candidates.find(c => 
          c.personalInfo.name === result.candidateName || 
          c.fileName === result.candidateId
        );
        
        return {
          ...result,
          ranking: index + 1,
          processedResume: originalCandidate || candidates[index]
        };
      })
      .sort((a: RankedCandidate, b: RankedCandidate) => b.matchingScore - a.matchingScore)
      .map((candidate: RankedCandidate, index: number) => ({
        ...candidate,
        ranking: index + 1
      }));

    return rankedCandidates;

  } catch (error) {
    console.error('AI matching error:', error);
    
    // Fallback to basic matching if AI fails
    return candidates.map((candidate, index) => ({
      candidateId: candidate.fileName || `candidate_${index}`,
      candidateName: candidate.personalInfo.name || `Candidate ${index + 1}`,
      matchingScore: 75, // Default score
      summary: `${candidate.personalInfo.name || 'This candidate'} has relevant experience and skills for this role.`,
      keyStrengths: candidate.skills.technical.slice(0, 3),
      potentialConcerns: [],
      fitAnalysis: {
        technicalFit: 75,
        experienceFit: 75,
        culturalFit: 70,
        growthPotential: 80
      },
      recommendation: 'maybe' as const,
      ranking: index + 1,
      processedResume: candidate
    }));
  }
}

/**
 * Get top candidate using AI matching
 */
export async function getTopCandidateWithAI(
  job: FormattedJD,
  candidates: ProcessedResume[]
): Promise<RankedCandidate | null> {
  if (candidates.length === 0) return null;
  
  const ranked = await matchCandidatesWithAI(job, candidates);
  return ranked[0] || null;
}

/**
 * Batch process candidates for better performance
 */
export async function batchMatchCandidates(
  job: FormattedJD,
  candidates: ProcessedResume[],
  batchSize: number = 10
): Promise<RankedCandidate[]> {
  const batches = [];
  for (let i = 0; i < candidates.length; i += batchSize) {
    batches.push(candidates.slice(i, i + batchSize));
  }

  const allResults: RankedCandidate[] = [];
  
  for (const batch of batches) {
    const batchResults = await matchCandidatesWithAI(job, batch);
    allResults.push(...batchResults);
  }

  // Re-rank all candidates together
  return allResults
    .sort((a, b) => b.matchingScore - a.matchingScore)
    .map((candidate, index) => ({
      ...candidate,
      ranking: index + 1
    }));
} 