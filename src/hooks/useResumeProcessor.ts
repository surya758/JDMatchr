import { useMutation } from '@tanstack/react-query';
import mammoth from 'mammoth';
import type { 
  ProcessedResume, 
  ProcessResumeResponse, 
  ProcessResumeInput 
} from '@/types/resume';

// Function to process text-based resumes (TXT/DOCX content)
const processResumeTextAPI = async (content: string, fileName: string): Promise<ProcessedResume> => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-resume-text`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        content: content.trim(),
        fileName,
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
    throw new Error(data.error || 'Failed to process resume');
  }

  return data.processedResume;
};

// Process DOCX files via edge function
const processDOCXFile = async (file: File): Promise<ProcessedResume> => {
  // Convert DOCX to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Remove data URL prefix (data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read DOCX file"));
    reader.readAsDataURL(file);
  });

  // Call the process-resume-docx edge function
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-resume-docx`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        docxData: base64Data,
        fileName: file.name,
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
    throw new Error(data.error || 'Failed to process DOCX resume');
  }

  return data.processedResume;
};

// Process image files via edge function
const processImageFile = async (file: File): Promise<ProcessedResume> => {
  // Convert image to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Remove data URL prefix (data:image/...;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

  // Call the process-resume-image edge function
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-resume-image`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        imageData: base64Data,
        mimeType: file.type,
        fileName: file.name,
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
    throw new Error(data.error || 'Failed to process image resume');
  }

  return data.processedResume;
};

// Process PDF files via edge function
const processPDFFile = async (file: File): Promise<ProcessedResume> => {
  // Convert PDF to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Remove data URL prefix (data:application/pdf;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read PDF file"));
    reader.readAsDataURL(file);
  });

  // Call the process-resume-pdf edge function
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-resume-pdf`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        pdfData: base64Data,
        fileName: file.name,
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
    throw new Error(data.error || 'Failed to process PDF resume');
  }

  return data.processedResume;
};

// Extract content from TXT files
const extractResumeContent = async (file: File): Promise<string> => {
  if (file.type === "text/plain" || file.name.toLowerCase().endsWith('.txt')) {
    // Handle TXT files
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || "");
      };
      reader.onerror = () => reject(new Error("Failed to read TXT file"));
      reader.readAsText(file);
    });
  } else {
    throw new Error(`Unsupported text file type: ${file.type}`);
  }
};

// Clean content helper
const cleanContent = (content: string): string => {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim();
};

// Main resume processing function
const processResume = async (input: ProcessResumeInput): Promise<ProcessResumeResponse> => {
  const startTime = Date.now();
  const { file } = input;

  if (!file) {
    throw new Error('Resume file is required');
  }

  const fileName = file.name;

  // Determine file type and processing strategy
  const textTypes = ['text/plain'];
  const textExtensions = ['.txt'];
  const docxTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const docxExtensions = ['.docx'];
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const pdfTypes = ['application/pdf'];

  const isTextFile = textTypes.includes(file.type) || 
    textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  const isDOCXFile = docxTypes.includes(file.type) || 
    docxExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  const isImageFile = imageTypes.includes(file.type.toLowerCase());
  const isPDFFile = pdfTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf');

  let processedResume: ProcessedResume;
  let source: 'text' | 'pdf' | 'image';
  let originalContent: string | undefined;

  if (isTextFile) {
    // Process TXT files
    const rawContent = await extractResumeContent(file);
    const cleanedContent = cleanContent(rawContent);
    
    if (cleanedContent.length === 0) {
      throw new Error('No content could be extracted from the resume file');
    }

    processedResume = await processResumeTextAPI(cleanedContent, fileName);
    source = 'text';
    originalContent = cleanedContent;

  } else if (isDOCXFile) {
    // Process DOCX files with edge function
    processedResume = await processDOCXFile(file);
    source = 'text'; // Keep as 'text' for UI consistency
    originalContent = 'DOCX processed via edge function';

  } else if (isImageFile) {
    // Process image files with edge function
    processedResume = await processImageFile(file);
    source = 'image';
    originalContent = 'Image processed via edge function';

  } else if (isPDFFile) {
    // Process PDF files with edge function
    processedResume = await processPDFFile(file);
    source = 'pdf';
    originalContent = 'PDF processed via edge function';

  } else {
    throw new Error(`Unsupported resume file type: ${file.type}. Supported types: TXT, DOCX, PDF (coming soon), Images (coming soon)`);
  }

  const processingTime = Date.now() - startTime;

  return {
    success: true,
    processedResume,
    source,
    originalContent,
    fileName,
    processingTime,
  };
};

// React Query hook for processing resumes
export const useResumeProcessor = () => {
  return useMutation({
    mutationFn: processResume,
    mutationKey: ['process-resume'],
  });
};

// Convenience hook for processing multiple resumes
export const useMultipleResumeProcessor = () => {
  const singleProcessor = useResumeProcessor();
  
  const processMultiple = async (files: File[]): Promise<ProcessResumeResponse[]> => {
    if (files.length === 0) {
      throw new Error('No resume files provided');
    }

    // Process files in parallel with error handling
    const results = await Promise.allSettled(
      files.map(file => processResume({ file }))
    );

    const processedResults: ProcessResumeResponse[] = [];
    const failedFiles: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        processedResults.push(result.value);
      } else {
        failedFiles.push(files[index].name);
        console.error(`Failed to process ${files[index].name}:`, result.reason);
      }
    });

    // If some files failed, include that information
    if (failedFiles.length > 0) {
      console.warn(`Failed to process ${failedFiles.length} files:`, failedFiles);
    }

    if (processedResults.length === 0) {
      throw new Error('Failed to process any resume files');
    }

    return processedResults;
  };

  return {
    ...singleProcessor,
    processMultiple,
  };
};

// Re-export types for convenience
export type { 
  ProcessedResume, 
  ProcessResumeResponse, 
  ProcessResumeInput 
} from '@/types/resume'; 