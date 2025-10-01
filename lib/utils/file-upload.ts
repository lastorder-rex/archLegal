import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Allowed file types and extensions
export const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/haansofthwp': ['.hwp'],
  'application/x-hwp': ['.hwp'],
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES = 3;

export interface AttachmentFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  uploadProgress?: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  storagePath?: string;
}

// Validate file type and size
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB 이하여야 합니다.` };
  }

  // Check file type
  const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = Object.values(ALLOWED_FILE_TYPES).flat();
    return {
      valid: false,
      error: `허용되지 않는 파일 형식입니다. 허용 형식: ${allowedExtensions.join(', ')}`
    };
  }

  return { valid: true };
}

// Generate file preview for images
export function generateFilePreview(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// Upload file to Supabase Storage
// consultationId is optional - will use 'temp' if not provided
export async function uploadFile(
  file: File,
  userId: string,
  consultationId: string | null = null,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const supabase = createClientComponentClient();

    // Use temp folder if no consultationId yet
    const folder = consultationId || `temp_${Date.now()}`;

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${userId}/${folder}/${fileName}`;

    // Resize image if needed (for large images)
    let processedFile = file;
    if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) { // 2MB
      processedFile = await resizeImage(file);
    }

    const { data, error } = await supabase.storage
      .from('consultation-attachments')
      .upload(filePath, processedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, path: data.path };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: '파일 업로드 중 오류가 발생했습니다.' };
  }
}

// Delete file from Supabase Storage
export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClientComponentClient();

    const { error } = await supabase.storage
      .from('consultation-attachments')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: '파일 삭제 중 오류가 발생했습니다.' };
  }
}

// Get file download URL
export async function getFileUrl(filePath: string): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = createClientComponentClient();

    const { data, error } = await supabase.storage
      .from('consultation-attachments')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Get URL error:', error);
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error) {
    console.error('Get URL error:', error);
    return { error: '파일 URL 생성 중 오류가 발생했습니다.' };
  }
}

// Resize image to reduce file size while maintaining quality
async function resizeImage(file: File, maxWidth = 1200, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            resolve(file); // Fallback to original
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => resolve(file); // Fallback to original
    img.src = URL.createObjectURL(file);
  });
}

// Get file icon based on file type
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('hwp')) return '📋';
  return '📎';
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}