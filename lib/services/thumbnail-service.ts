import sharp from 'sharp';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';

const THUMBNAIL_SIZE = 200;
const THUMBNAIL_QUALITY = 80;
const STORAGE_BUCKET = 'thumbnails';

const logError = (message: string, error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[thumbnail-service] ${message}:`, detail);
};

const extractStoragePath = (thumbnailUrl: string): string | null => {
  try {
    const url = new URL(thumbnailUrl);
    const [, storagePath] = url.pathname.split(`/${STORAGE_BUCKET}/`);
    return storagePath ?? null;
  } catch (error) {
    logError('Failed to parse thumbnail URL', error);
    return null;
  }
};

/**
 * 이미지 파일로부터 썸네일 생성
 * @param fileBuffer 원본 파일 버퍼
 * @param mimeType 파일 MIME 타입
 * @returns 썸네일 버퍼 (JPEG)
 */
export async function generateThumbnail(fileBuffer: Buffer, mimeType: string): Promise<Buffer | null> {
  if (!mimeType.startsWith('image/')) {
    return null;
  }

  try {
    return await sharp(fileBuffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: THUMBNAIL_QUALITY,
        progressive: true
      })
      .toBuffer();
  } catch (error) {
    logError('Failed to generate thumbnail', error);
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
    const supabase = getSupabaseAdminClient();

    // 파일 경로: consultations/{consultationId}/{fileName}.jpg
    const filePath = `consultations/${consultationId}/${fileName}.jpg`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: true, // 동일 파일명 시 덮어쓰기
        cacheControl: '31536000' // 1년 (썸네일은 변경되지 않으므로 장기 캐싱)
      });

    if (error) {
      logError('Upload failed', error);
      return null;
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    logError('Unexpected error during upload', error);
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
    const filePath = extractStoragePath(thumbnailUrl);

    if (!filePath) {
      return;
    }

    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
    if (error) {
      logError('Delete failed', error);
    }
  } catch (error) {
    logError('Unexpected error during delete', error);
  }
}
