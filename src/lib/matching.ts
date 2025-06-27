import { ProcessedResume } from '@/types/resume';
import { FormattedJD } from '@/hooks/useJobDescriptionProcessor';

export interface MatchingResult {
  candidateId: string;
  candidateName: string;
  matchingScore: number;
  breakdown: {
    requiredSkillsScore: number;
    experienceScore: number;
    preferredSkillsScore: number;
    educationScore: number;
    notableFactorsScore: number;
  };
  summary: string;
}

export interface RankedCandidate extends MatchingResult {
  ranking: number;
  processedResume: ProcessedResume;
}

/**
 * Calculate matching score between a job and candidate
 */
export function calculateMatchingScore(
  job: FormattedJD,
  candidate: ProcessedResume
): MatchingResult {
  // Weights for different scoring factors
  const weights = {
    requiredSkills: 0.4,
    experience: 0.25,
    preferredSkills: 0.2,
    education: 0.1,
    notableFactors: 0.05
  };

  // Calculate individual scores
  const requiredSkillsScore = calculateRequiredSkillsScore(job.requiredSkills, candidate);
  const experienceScore = calculateExperienceScore(job.experienceLevel, candidate);
  const preferredSkillsScore = calculatePreferredSkillsScore(job.preferredSkills, candidate);
  const educationScore = calculateEducationScore(job.qualifications, candidate);
  const notableFactorsScore = calculateNotableFactorsScore(candidate);

  // Calculate weighted total score
  const matchingScore = Math.round(
    (requiredSkillsScore * weights.requiredSkills +
     experienceScore * weights.experience +
     preferredSkillsScore * weights.preferredSkills +
     educationScore * weights.education +
     notableFactorsScore * weights.notableFactors)
  );

  // Generate summary
  const summary = generateMatchingSummary(matchingScore, candidate);

  return {
    candidateId: candidate.fileName || 'unknown',
    candidateName: candidate.personalInfo.name || 'Unknown Candidate',
    matchingScore: Math.min(100, Math.max(0, matchingScore)),
    breakdown: {
      requiredSkillsScore,
      experienceScore,
      preferredSkillsScore,
      educationScore,
      notableFactorsScore
    },
    summary
  };
}

/**
 * Calculate required skills matching score (40% weight)
 */
function calculateRequiredSkillsScore(requiredSkills: string[], candidate: ProcessedResume): number {
  if (!requiredSkills.length) return 80; // Default if no requirements

  const candidateSkills = [
    ...candidate.skills.technical,
    ...candidate.skills.tools,
    ...candidate.skills.frameworks
  ].map(skill => skill.toLowerCase());

  let totalScore = 0;
  let criticalSkillsMissing = 0;

  for (const requiredSkill of requiredSkills) {
    const skillLower = requiredSkill.toLowerCase();
    
    // Check for exact matches
    if (candidateSkills.some(cs => cs.includes(skillLower) || skillLower.includes(cs))) {
      totalScore += 100;
    }
    // Check for related skills (partial matches)
    else if (candidateSkills.some(cs => {
      const similarity = calculateStringSimilarity(cs, skillLower);
      return similarity > 0.6;
    })) {
      totalScore += 70;
    }
    // Check for similar technologies (e.g., React vs Vue)
    else if (findSimilarTechnology(skillLower, candidateSkills)) {
      totalScore += 40;
    }
    // Missing critical skill
    else {
      criticalSkillsMissing++;
      totalScore += 0;
    }
  }

  const baseScore = totalScore / requiredSkills.length;
  
  // Penalty for missing critical skills
  const penalty = criticalSkillsMissing * 5;
  
  return Math.max(0, baseScore - penalty);
}

/**
 * Calculate experience level matching score (25% weight)
 */
function calculateExperienceScore(requiredLevel: string | undefined, candidate: ProcessedResume): number {
  if (!requiredLevel) return 80; // Default if no requirement

  const candidateYears = candidate.experience.totalYears;
  const candidateSeniority = candidate.overallProfile.seniorityLevel;

  // Map experience levels to years
  const levelToYears: Record<string, number> = {
    'entry': 1,
    'junior': 2,
    'mid': 4,
    'senior': 7,
    'lead': 10,
    'executive': 15
  };

  const requiredYears = levelToYears[requiredLevel.toLowerCase()] || 3;
  
  // Perfect match
  if (candidateYears >= requiredYears && candidateYears <= requiredYears + 3) {
    return 100;
  }
  
  // Overqualified (slight penalty)
  if (candidateYears > requiredYears + 3) {
    return Math.max(60, 100 - (candidateYears - requiredYears) * 2);
  }
  
  // Underqualified
  if (candidateYears < requiredYears) {
    const gap = requiredYears - candidateYears;
    return Math.max(20, 80 - gap * 15);
  }

  return 80;
}

/**
 * Calculate preferred skills bonus score (20% weight)
 */
function calculatePreferredSkillsScore(preferredSkills: string[], candidate: ProcessedResume): number {
  if (!preferredSkills.length) return 0; // No bonus if no preferred skills

  const candidateSkills = [
    ...candidate.skills.technical,
    ...candidate.skills.tools,
    ...candidate.skills.frameworks
  ].map(skill => skill.toLowerCase());

  let bonusScore = 0;

  for (const preferredSkill of preferredSkills) {
    const skillLower = preferredSkill.toLowerCase();
    
    if (candidateSkills.some(cs => cs.includes(skillLower) || skillLower.includes(cs))) {
      bonusScore += 15; // Bonus for each preferred skill
    }
  }

  // Cap bonus at 100
  return Math.min(100, bonusScore);
}

/**
 * Calculate education matching score (10% weight)
 */
function calculateEducationScore(qualifications: string[], candidate: ProcessedResume): number {
  if (!qualifications.length) return 80; // Default if no requirements

  const candidateEducation = candidate.education.map(edu => 
    `${edu.degree} ${edu.institution}`.toLowerCase()
  );
  const candidateCertifications = candidate.certifications.map(cert => cert.toLowerCase());

  let score = 60; // Base score

  for (const qualification of qualifications) {
    const qualLower = qualification.toLowerCase();
    
    // Check education match
    if (candidateEducation.some(edu => 
      edu.includes('bachelor') && qualLower.includes('bachelor') ||
      edu.includes('master') && qualLower.includes('master') ||
      edu.includes('phd') && qualLower.includes('phd')
    )) {
      score += 30;
    }
    
    // Check certification match
    if (candidateCertifications.some(cert => 
      cert.includes(qualLower) || qualLower.includes(cert)
    )) {
      score += 20;
    }
  }

  return Math.min(100, score);
}

/**
 * Calculate notable factors score (5% weight)
 */
function calculateNotableFactorsScore(candidate: ProcessedResume): number {
  let score = 50; // Base score

  // Dark horse potential bonus
  if (candidate.notablePoints.uniqueExperiences.length > 2) {
    score += 20;
  }

  // Standout achievements bonus
  if (candidate.notablePoints.standoutAchievements.length > 1) {
    score += 15;
  }

  // Career progression bonus
  if (candidate.notablePoints.careerProgression.toLowerCase().includes('strong') ||
      candidate.notablePoints.careerProgression.toLowerCase().includes('excellent')) {
    score += 10;
  }

  // Industry diversity bonus
  if (candidate.notablePoints.industryDiversity.length > 2) {
    score += 10;
  }

  // Red flags penalty
  if (candidate.notablePoints.potentialRedFlags.length > 0) {
    score -= candidate.notablePoints.potentialRedFlags.length * 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate matching summary text
 */
function generateMatchingSummary(score: number, candidate: ProcessedResume): string {
  const name = candidate.personalInfo.name || 'This candidate';
  
  if (score >= 90) {
    return `${name} is an excellent match with strong alignment across all key requirements.`;
  } else if (score >= 80) {
    return `${name} is a very good match with solid qualifications for this role.`;
  } else if (score >= 70) {
    return `${name} is a good match with most required qualifications present.`;
  } else if (score >= 60) {
    return `${name} is a moderate match with some gaps in key requirements.`;
  } else {
    return `${name} has limited alignment with the core requirements for this role.`;
  }
}

/**
 * Rank all candidates for a job
 */
export function rankCandidates(
  job: FormattedJD,
  candidates: ProcessedResume[]
): RankedCandidate[] {
  // Calculate scores for all candidates
  const scoredCandidates = candidates.map(candidate => ({
    ...calculateMatchingScore(job, candidate),
    processedResume: candidate
  }));

  // Sort by score (highest first) and add rankings
  const rankedCandidates = scoredCandidates
    .sort((a, b) => b.matchingScore - a.matchingScore)
    .map((candidate, index) => ({
      ...candidate,
      ranking: index + 1
    }));

  return rankedCandidates;
}

/**
 * Get top candidate for anonymous users
 */
export function getTopCandidate(
  job: FormattedJD,
  candidates: ProcessedResume[]
): RankedCandidate | null {
  if (candidates.length === 0) return null;
  
  const ranked = rankCandidates(job, candidates);
  return ranked[0] || null;
}

// Helper functions

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function findSimilarTechnology(skill: string, candidateSkills: string[]): boolean {
  const similarTech: Record<string, string[]> = {
    'react': ['vue', 'angular', 'svelte'],
    'vue': ['react', 'angular', 'svelte'],
    'angular': ['react', 'vue', 'svelte'],
    'node': ['express', 'fastify', 'koa'],
    'python': ['django', 'flask', 'fastapi'],
    'java': ['spring', 'kotlin', 'scala'],
    'javascript': ['typescript', 'node', 'react'],
    'typescript': ['javascript', 'node', 'react']
  };

  const similar = similarTech[skill.toLowerCase()] || [];
  return candidateSkills.some(cs => 
    similar.some(tech => cs.includes(tech) || tech.includes(cs))
  );
} 