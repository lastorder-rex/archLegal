import sharp from 'sharp';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';

const THUMBNAIL_SIZE = 200;
const THUMBNAIL_QUALITY = 80;
const STORAGE_BUCKET = 'thumbnails';

/**
 * 이미지 파일로부터 썸네일 생성
 * @param fileBuffer 원본 파일 버퍼
 * @param mimeType 파일 MIME 타입
 * @returns 썸네일 버퍼 (JPEG)
 */
export async function generateThumbnail(fileBuffer: Buffer, mimeType: string): Promise<Buffer | null> {
  // 이미지 파일만 썸네일 생성
  if (!mimeType.startsWith('image/')) {
    console.log('[thumbnail-service] skipping non-image file', { mimeType });
    return null;
  }

  try {
    console.log('[thumbnail-service] generating thumbnail', {
      bufferSize: fileBuffer.length,
      mimeType
    });

    const thumbnail = await sharp(fileBuffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: THUMBNAIL_QUALITY,
        progressive: true
      })
      .toBuffer();

    console.log('[thumbnail-service] thumbnail generated', {
      originalSize: fileBuffer.length,
      thumbnailSize: thumbnail.length
    });

    return thumbnail;
  } catch (error) {
    console.error('[thumbnail-service] FAILED to generate thumbnail', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      mimeType,
      bufferSize: fileBuffer.length
    });
    return null;
  }
}

/**
 * 썸네일을 Supabase Storage에 업로드
 * @param thumbnailBuffer 썸네일 버퍼
 * @param fileName 파일명 (확장자 제외)
 * @param consultationId 상담 ID
 * @returns 썸네일 public URL
 */
export async function uploadThumbnailToStorage(
  thumbnailBuffer: Buffer,
  fileName: string,
  consultationId: string
): Promise<string | null> {
  try {
    console.log('[thumbnail-service] uploading thumbnail to storage', {
      fileName,
      consultationId,
      bufferSize: thumbnailBuffer.length,
      bucket: STORAGE_BUCKET
    });

    const supabase = getSupabaseAdminClient();

    // 파일 경로: consultations/{consultationId}/{fileName}.jpg
    const filePath = `consultations/${consultationId}/${fileName}.jpg`;

    console.log('[thumbnail-service] uploading to path', { filePath });

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: true, // 동일 파일명 시 덮어쓰기
        cacheControl: '31536000' // 1년
      });

    if (error) {
      console.error('[thumbnail-service] FAILED to upload thumbnail', {
        error: error.message,
        statusCode: (error as any).statusCode,
        filePath,
        bucket: STORAGE_BUCKET
      });
      return null;
    }

    console.log('[thumbnail-service] upload successful', { data });

    // Public URL 생성
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    console.log('[thumbnail-service] public URL generated', { publicUrl: publicUrlData.publicUrl });

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('[thumbnail-service] UNEXPECTED error uploading thumbnail', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

/**
 * Supabase Storage에서 썸네일 삭제
 * @param thumbnailUrl 썸네일 URL
 */
export async function deleteThumbnailFromStorage(thumbnailUrl: string | null): Promise<void> {
  if (!thumbnailUrl) return;

  try {
    const supabase = getSupabaseAdminClient();

    // URL에서 파일 경로 추출
    // 예: https://.../storage/v1/object/public/thumbnails/consultations/xxx/file.jpg
    // → consultations/xxx/file.jpg
    const urlParts = thumbnailUrl.split(`/${STORAGE_BUCKET}/`);
    if (urlParts.length < 2) {
      console.warn('[thumbnail-service] invalid thumbnail URL format', thumbnailUrl);
      return;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('[thumbnail-service] failed to delete thumbnail', error);
    }
  } catch (error) {
    console.error('[thumbnail-service] unexpected error deleting thumbnail', error);
  }
}
