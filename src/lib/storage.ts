import { supabase } from './supabase';

export interface FileUploadResult {
  success: boolean;
  fileUrl?: string;
  filePath?: string;
  error?: string;
}

export interface FileUploadOptions {
  file: File;
  userId: string;
  jobId?: string;
  folder?: string;
}

/**
 * Upload a resume file to Supabase Storage
 * Files are organized as: {userId}/{jobId}/{timestamp}_{filename}
 */
export async function uploadResumeFile({
  file,
  userId,
  jobId,
  folder = 'general'
}: FileUploadOptions): Promise<FileUploadResult> {
  try {
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error in uploadResumeFile:', authError);
      return {
        success: false,
        error: `Authentication error: ${authError.message}`
      };
    }
    
    if (!user) {
      console.error('No authenticated user found in uploadResumeFile');
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Verify the userId matches the authenticated user
    if (user.id !== userId) {
      console.error('User ID mismatch in uploadResumeFile:', { authUserId: user.id, providedUserId: userId });
      return {
        success: false,
        error: 'User ID mismatch - unauthorized access'
      };
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    
    // Create file path: userId/jobId/filename or userId/folder/filename
    const filePath = jobId 
      ? `${userId}/${jobId}/${fileName}`
      : `${userId}/${folder}/${fileName}`;

    console.log('Uploading file to storage:', { filePath, fileSize: file.size, fileType: file.type });

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('resume-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: `Storage error: ${error.message}`
      };
    }

    console.log('File uploaded successfully:', data);

    // Get public URL (for private buckets, this will be a signed URL)
    const { data: urlData } = supabase.storage
      .from('resume-files')
      .getPublicUrl(filePath);

    return {
      success: true,
      fileUrl: urlData.publicUrl,
      filePath: filePath
    };

  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate a signed URL for downloading a resume file
 * Signed URLs expire after 1 hour for security
 */
export async function getSignedDownloadUrl(filePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('resume-files')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    return null;
  }
}

/**
 * Delete a resume file from storage
 */
export async function deleteResumeFile(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('resume-files')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
}

/**
 * List files in a user's folder
 */
export async function listUserFiles(userId: string, jobId?: string): Promise<string[]> {
  try {
    const folderPath = jobId ? `${userId}/${jobId}` : userId;
    
    const { data, error } = await supabase.storage
      .from('resume-files')
      .list(folderPath);

    if (error) {
      console.error('Error listing files:', error);
      return [];
    }

    return data?.map(file => `${folderPath}/${file.name}`) || [];
  } catch (error) {
    console.error('File listing error:', error);
    return [];
  }
}

/**
 * Get file info including size and metadata
 */
export async function getFileInfo(filePath: string) {
  try {
    const { data, error } = await supabase.storage
      .from('resume-files')
      .list(filePath.split('/').slice(0, -1).join('/'), {
        search: filePath.split('/').pop()
      });

    if (error) {
      console.error('Error getting file info:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('File info error:', error);
    return null;
  }
} 