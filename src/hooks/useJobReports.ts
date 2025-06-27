import { useQuery } from '@tanstack/react-query';
import { getUserJobReports } from '@/lib/jobs';

export interface JobReport {
  id: string;
  jobTitle: string;
  company: string;
  date: string;
  candidatesAnalyzed: number;
  topMatch: string;
  topCandidateFileUrl: string | null;
  topCandidateFilePath: string | null;
  topCandidateFileName: string | null;
  matchScore: number;
  averageScore: number;
  status: 'completed' | 'processing' | 'failed';
  rawDescription: string;
  formattedJd: any;
}

export const useJobReports = () => {
  return useQuery({
    queryKey: ['job-reports'],
    queryFn: getUserJobReports,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}; 