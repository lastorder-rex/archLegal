import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { resolveUploadContext, MAX_FILES_PER_FOLDER } from '@/lib/services/upload-context';
import { buildDriveFileName, uploadFileToDriveFolder } from '@/lib/services/consultation-drive-service';

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = (formData.get('token') as string) ?? '';
    const templateName = (formData.get('templateName') as string) ?? '';
    const file = formData.get('file');

    if (!token || !templateName || !(file instanceof File)) {
      return NextResponse.json({ error: '필수 값이 누락되었습니다.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: '지원하지 않는 파일 형식입니다. (jpg, png, pdf, heic)' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
    }

    const resolveResult = await resolveUploadContext(token);
    if (!resolveResult.ok) {
      return NextResponse.json({ error: resolveResult.error }, { status: resolveResult.status });
    }

    const { context } = resolveResult;
    const targetFolder = context.folders.find((folder) => folder.templateName === templateName);

    if (!targetFolder) {
      return NextResponse.json({ error: '업로드가 허용되지 않은 폴더입니다.' }, { status: 400 });
    }

    if (targetFolder.remainingSlots <= 0) {
      return NextResponse.json({ error: `해당 폴더에는 최대 ${MAX_FILES_PER_FOLDER}개의 파일만 업로드할 수 있습니다.` }, { status: 409 });
    }

    if (!context.dryRun && !targetFolder.folderId) {
      return NextResponse.json({ error: '문서 폴더가 준비되지 않았습니다. 관리자에게 문의해주세요.' }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const customerName = context.consultation.name ?? '고객';
    const finalFileName = buildDriveFileName(targetFolder.displayName, customerName, file.name);

    const driveResult = context.dryRun
      ? { fileId: `dry-run-${Date.now()}`, dryRun: true as const }
      : await uploadFileToDriveFolder({
          folderId: targetFolder.folderId ?? '',
          fileName: finalFileName,
          mimeType: file.type,
          data: buffer
        });

    const supabase = getSupabaseAdminClient();
    const filePath = `${targetFolder.templateName}/${finalFileName}`;

    await supabase.from('upload_tokens').update({ updated_at: new Date().toISOString() }).eq('id', context.token.id);

    await supabase.from('upload_logs').insert({
      upload_token_id: context.token.id,
      upload_token: context.token.token,
      consultation_id: context.consultation.id,
      payment_id: context.paymentStage?.id ?? null,
      file_name: finalFileName,
      file_path: filePath,
      mime_type: file.type || null,
      file_size: buffer.length,
      drive_file_id: driveResult.fileId,
      ip_address: request.headers.get('x-forwarded-for') ?? null,
      user_agent: request.headers.get('user-agent') ?? null,
      uploaded_at: new Date().toISOString()
    });

    const refreshed = await resolveUploadContext(token);
    if (!refreshed.ok) {
      // Even if refresh fails, return success with minimal payload
      return NextResponse.json({
        success: true,
        fileName: finalFileName,
        filePath,
        driveFileId: driveResult.fileId,
        dryRun: driveResult.dryRun
      });
    }

    const updatedFolder = refreshed.context.folders.find((folder) => folder.templateName === templateName);

    return NextResponse.json({
      success: true,
      fileName: finalFileName,
      filePath,
      driveFileId: driveResult.fileId,
      dryRun: driveResult.dryRun,
      folder: updatedFolder
        ? {
            templateName: updatedFolder.templateName,
            displayName: updatedFolder.displayName,
            remainingSlots: updatedFolder.remainingSlots,
            uploads: updatedFolder.uploads.map((upload) => ({
              id: upload.id,
              fileName: upload.file_name,
              filePath: upload.file_path,
              uploadedAt: upload.uploaded_at,
              mimeType: upload.mime_type
            }))
          }
        : null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    console.error('[upload/files] unexpected error', error);
    return NextResponse.json({ error: '파일 업로드 중 오류가 발생했습니다.', detail: message }, { status: 500 });
  }
}
