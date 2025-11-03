import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { resolveUploadContext } from '@/lib/services/upload-context';
import type { UploadContext, UploadFolderInfo } from '@/lib/services/upload-context';
import { buildDriveFileName, uploadFileToDriveFolder, deleteDriveFile } from '@/lib/services/consultation-drive-service';
import { generateThumbnail, uploadThumbnailToStorage, deleteThumbnailFromStorage } from '@/lib/services/thumbnail-service';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'application/pdf'
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status });

const mapUploadRecord = (upload: UploadFolderInfo['uploads'][number]) => ({
  id: upload.id,
  fileName: upload.file_name,
  filePath: upload.file_path,
  uploadedAt: upload.uploaded_at,
  mimeType: upload.mime_type,
  thumbnailUrl: upload.thumbnail_url ?? null
});

const mapFolderRecord = (folder: UploadFolderInfo) => ({
  templateName: folder.templateName,
  displayName: folder.displayName,
  remainingSlots: folder.remainingSlots,
  uploads: folder.uploads.map(mapUploadRecord)
});

const mapFoldersForClient = (folders: UploadContext['folders']) => folders.map(mapFolderRecord);

const createThumbnailFileName = () => `${Date.now()}-${randomUUID()}`.replace(/[^A-Za-z0-9-]/g, '');

const refreshContext = async (token: string) => {
  const refreshed = await resolveUploadContext(token);
  return refreshed.ok ? refreshed.context : null;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = (formData.get('token') as string) ?? '';
    const templateName = (formData.get('templateName') as string) ?? '';
    const file = formData.get('file');

    if (!token || !templateName || !(file instanceof File)) {
      return jsonError('필수 값이 누락되었습니다.', 400);
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return jsonError('지원하지 않는 파일 형식입니다. (jpg, png, pdf, heic)', 400);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return jsonError('파일 크기는 10MB 이하여야 합니다.', 400);
    }

    const resolveResult = await resolveUploadContext(token);
    if (!resolveResult.ok) {
      return jsonError(resolveResult.error, resolveResult.status);
    }

    const { context } = resolveResult;
    const targetFolder = context.folders.find((folder) => folder.templateName === templateName);

    if (!targetFolder) {
      return jsonError('업로드가 허용되지 않은 폴더입니다.', 400);
    }

    if (targetFolder.remainingSlots <= 0) {
      return jsonError(`해당 폴더에는 최대 ${context.maxFilesPerFolder}개의 파일만 업로드할 수 있습니다.`, 409);
    }

    if (!targetFolder.folderId) {
      return jsonError('문서 폴더가 준비되지 않았습니다. 관리자에게 문의해주세요.', 500);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const customerName = context.consultation.name ?? '고객';
    const finalFileName = buildDriveFileName(targetFolder.displayName, customerName, file.name);
    const folderId = targetFolder.folderId;

    const driveFileId = await uploadFileToDriveFolder({
      folderId,
      fileName: finalFileName,
      mimeType: file.type,
      data: buffer
    });

    const supabase = getSupabaseAdminClient();
    const filePath = `${targetFolder.templateName}/${finalFileName}`;

    // 썸네일 생성 및 업로드 (이미지 파일만)
    let thumbnailUrl: string | null = null;
    if (file.type.startsWith('image/')) {
      const thumbnailBuffer = await generateThumbnail(buffer, file.type);
      if (thumbnailBuffer) {
        // 파일명 충돌 방지: 타임스탬프 + UUID 조합 (Supabase Storage는 ASCII만 허용)
        const thumbnailFileName = createThumbnailFileName();
        thumbnailUrl = await uploadThumbnailToStorage(thumbnailBuffer, thumbnailFileName, context.consultation.id);
      }
    }

    const nowIso = new Date().toISOString();
    await supabase.from('upload_tokens').update({ updated_at: nowIso }).eq('id', context.token.id);

    await supabase.from('upload_logs').insert({
      upload_token_id: context.token.id,
      upload_token: context.token.token,
      consultation_id: context.consultation.id,
      payment_id: context.paymentStage?.id ?? null,
      file_name: finalFileName,
      file_path: filePath,
      mime_type: file.type || null,
      file_size: buffer.length,
      drive_file_id: driveFileId,
      thumbnail_url: thumbnailUrl,
      ip_address: request.headers.get('x-forwarded-for') ?? null,
      user_agent: request.headers.get('user-agent') ?? null,
      uploaded_at: nowIso
    });

    const refreshedContext = await refreshContext(token);
    if (!refreshedContext) {
      return NextResponse.json({ success: true, fileName: finalFileName, filePath, driveFileId });
    }

    const updatedFolder = refreshedContext.folders.find((folder) => folder.templateName === templateName);
    return NextResponse.json({
      success: true,
      fileName: finalFileName,
      filePath,
      driveFileId,
      folder: updatedFolder ? mapFolderRecord(updatedFolder) : null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    console.error('[upload/files] unexpected error', error);
    return NextResponse.json({ error: '파일 업로드 중 오류가 발생했습니다.', detail: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token : '';
    const uploadId = typeof body.uploadId === 'string' ? body.uploadId : '';

    if (!token || !uploadId) {
      return jsonError('필수 값이 누락되었습니다.', 400);
    }

    const resolveResult = await resolveUploadContext(token);
    if (!resolveResult.ok) {
      return jsonError(resolveResult.error, resolveResult.status);
    }

    const { context } = resolveResult;
    const belongsToToken = context.folders.some((folder) => folder.uploads.some((upload) => upload.id === uploadId));
    if (!belongsToToken) {
      return jsonError('삭제할 파일을 찾을 수 없습니다.', 404);
    }

    const supabase = getSupabaseAdminClient();
    const { data: logRow, error: logError } = await supabase
      .from('upload_logs')
      .select('id, consultation_id, payment_id, drive_file_id, thumbnail_url')
      .eq('id', uploadId)
      .maybeSingle();

    if (logError) {
      console.error('[upload/files] log fetch error', logError);
      return jsonError('업로드 정보를 확인하지 못했습니다.', 500);
    }

    if (!logRow) {
      return jsonError('삭제할 파일을 찾을 수 없습니다.', 404);
    }

    if (logRow.consultation_id !== context.consultation.id) {
      return jsonError('삭제 권한이 없습니다.', 403);
    }

    if (context.paymentStage?.id && logRow.payment_id !== context.paymentStage.id) {
      return jsonError('삭제 권한이 없습니다.', 403);
    }

    if (!context.paymentStage?.id && logRow.payment_id) {
      return jsonError('삭제 권한이 없습니다.', 403);
    }

    if (!context.dryRun && logRow.drive_file_id) {
      await deleteDriveFile(logRow.drive_file_id);
    }

    // 썸네일 삭제
    if (logRow.thumbnail_url) {
      await deleteThumbnailFromStorage(logRow.thumbnail_url);
    }

    const { error: deleteError } = await supabase.from('upload_logs').delete().eq('id', uploadId);
    if (deleteError) {
      console.error('[upload/files] log delete error', deleteError);
      return jsonError('파일 삭제에 실패했습니다.', 500);
    }

    const nowIso = new Date().toISOString();
    await supabase.from('upload_tokens').update({ updated_at: nowIso }).eq('id', context.token.id);

    const refreshedContext = await refreshContext(token);
    if (!refreshedContext) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, folders: mapFoldersForClient(refreshedContext.folders) });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    console.error('[upload/files] delete error', error);
    return NextResponse.json({ error: '파일 삭제 중 오류가 발생했습니다.', detail: message }, { status: 500 });
  }
}
