// Resume processing types for JDMatchr

export interface PersonalInfo {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedIn?: string;
  github?: string;
  portfolio?: string;
}

export interface WorkExperience {
  title: string;
  company: string;
  duration: string;
  keyResponsibilities: string[];
  achievements?: string[];
}

export interface Experience {
  totalYears: number;
  currentRole?: string;
  currentCompany?: string;
  positions: WorkExperience[];
}

export interface Skills {
  technical: string[];
  soft: string[];
  tools: string[];
  languages?: string[];
  frameworks?: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year?: string;
  gpa?: string;
  relevantCourses?: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies?: string[];
  achievements?: string[];
}

export interface NotablePoints {
  uniqueExperiences: string[];
  standoutAchievements: string[];
  potentialRedFlags: string[];
  careerProgression: string;
  industryDiversity: string[];
}

export interface OverallProfile {
  seniorityLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive';
  primaryExpertise: string[];
  careerFocus: string;
  potentialFit: string;
}

export interface ProcessedResume {
  fileName: string;
  personalInfo: PersonalInfo;
  experience: Experience;
  skills: Skills;
  education: Education[];
  certifications: string[];
  projects: Project[];
  notablePoints: NotablePoints;
  summary: string;
  overallProfile: OverallProfile;
}

export interface ProcessResumeResponse {
  success: boolean;
  processedResume: ProcessedResume;
  source: 'text' | 'pdf' | 'image';
  originalContent?: string;
  fileName: string;
  processingTime?: number;
}

export interface ProcessResumeInput {
  file: File;
}

// Resume comparison and scoring types (for future use)
export interface ResumeScore {
  resumeId: string;
  fileName: string;
  overallScore: number;
  categoryScores: {
    experienceMatch: number;
    skillsMatch: number;
    educationMatch: number;
    cultureMatch: number;
  };
  matchingPoints: string[];
  concerns: string[];
  standoutQualities: string[];
  recommendation: string;
}

export interface ResumeRanking {
  rankedResumes: ResumeScore[];
  totalProcessed: number;
  processingTime: number;
  darkHorse?: {
    resumeId: string;
    reason: string;
    potentialValue: string;
  };
  topPick?: {
    resumeId: string;
    reason: string;
    keyStrengths: string[];
  };
}

// File processing status
export interface ResumeProcessingStatus {
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface BulkResumeProcessingStatus {
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  inProgress: boolean;
  fileStatuses: ResumeProcessingStatus[];
  overallProgress: number;
} 