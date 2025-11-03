import sharp from 'sharp';
import { randomUUID } from 'crypto';
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
    return null;
  }

  try {
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

    return thumbnail;
  } catch (error) {
    console.error('[thumbnail-service] Failed to generate thumbnail:', error instanceof Error ? error.message : String(error));
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
      console.error('[thumbnail-service] Upload failed:', error.message);
      return null;
    }

    // Public URL 생성
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('[thumbnail-service] Unexpected error:', error instanceof Error ? error.message : String(error));
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
    let filePath: string;
    try {
      const url = new URL(thumbnailUrl);
      const pathParts = url.pathname.split(`/${STORAGE_BUCKET}/`);
      if (pathParts.length < 2) {
        throw new Error('Invalid path structure');
      }
      filePath = pathParts[1];
    } catch (parseError) {
      console.error('[thumbnail-service] Failed to parse thumbnail URL:', thumbnailUrl, parseError instanceof Error ? parseError.message : String(parseError));
      return;
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('[thumbnail-service] Delete failed:', error.message);
    }
  } catch (error) {
    console.error('[thumbnail-service] Unexpected error:', error instanceof Error ? error.message : String(error));
  }
}
