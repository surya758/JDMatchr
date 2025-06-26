import { useMutation } from '@tanstack/react-query';
import mammoth from 'mammoth';

interface FormattedJD {
  title: string;
  company?: string;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  benefits?: string[];
  summary: string;
}

interface ProcessJDResponse {
  success: boolean;
  formattedJD: FormattedJD;
  originalContent: string;
  source: 'text' | 'file';
  fileName?: string;
  isImageFile?: boolean;
}

interface ProcessJDInput {
  type: 'text' | 'file';
  content?: string;
  file?: File;
}

const formatJobDescriptionAPI = async (content: string): Promise<FormattedJD> => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/format-job-description`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        content: content.trim(),
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
    throw new Error(data.error || 'Failed to format job description');
  }

  return data.formattedJD;
};

const extractFileContent = async (file: File): Promise<string> => {
  // Handle different file types
  if (file.type === "text/plain" || file.name.toLowerCase().endsWith('.txt')) {
    // Handle TXT files
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || "");
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  } else if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith('.docx')
  ) {
    // Handle DOCX files with mammoth
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as ArrayBuffer);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
    
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } else {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
};

const processImageFile = async (file: File): Promise<FormattedJD> => {
  // Convert image to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Remove data URL prefix (data:image/jpeg;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

  // Call the process-image-jd edge function
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-image-jd`,
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
    throw new Error(data.error || 'Failed to process image');
  }

  return data.formattedJD;
};

const cleanContent = (content: string): string => {
  // Clean up content by removing blank lines and extra whitespace
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim();
};

const processJobDescription = async (input: ProcessJDInput): Promise<ProcessJDResponse> => {
  let rawContent: string;
  let fileName: string | undefined;

  if (input.type === 'text') {
    if (!input.content || input.content.trim().length === 0) {
      throw new Error('Job description content is required');
    }
    rawContent = input.content.trim();
  } else if (input.type === 'file') {
    if (!input.file) {
      throw new Error('File is required');
    }
    
    fileName = input.file.name;
    
    // Check if it's an image file
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (imageTypes.includes(input.file.type.toLowerCase())) {
      // Process image directly with Gemini API
      const formattedJD = await processImageFile(input.file);
      
      return {
        success: true,
        formattedJD,
        originalContent: 'Image processed directly',
        source: input.type,
        fileName,
        isImageFile: true, // Flag to identify image processing
      };
    } else {
      // Extract content from text files (TXT/DOCX)
      rawContent = await extractFileContent(input.file);
      
      // Clean the extracted content
      rawContent = cleanContent(rawContent);
      
      if (rawContent.length === 0) {
        throw new Error('No content could be extracted from the file');
      }
    }
  } else {
    throw new Error('Invalid input type');
  }

  // Format the content using the API (for text input and text files)
  const formattedJD = await formatJobDescriptionAPI(rawContent);

  return {
    success: true,
    formattedJD,
    originalContent: rawContent,
    source: input.type,
    fileName,
  };
};

export const useJobDescriptionProcessor = () => {
  return useMutation({
    mutationFn: processJobDescription,
    mutationKey: ['process-job-description'],
  });
};

// Convenience hooks for specific use cases
export const useProcessTextJD = () => {
  const mutation = useJobDescriptionProcessor();
  
  return {
    ...mutation,
    processText: (content: string) => 
      mutation.mutate({ type: 'text', content }),
  };
};

export const useProcessFileJD = () => {
  const mutation = useJobDescriptionProcessor();
  
  return {
    ...mutation,
    processFile: (file: File) => 
      mutation.mutate({ type: 'file', file }),
  };
};

export type { FormattedJD, ProcessJDResponse, ProcessJDInput }; 