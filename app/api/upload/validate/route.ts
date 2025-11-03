import { NextRequest, NextResponse } from 'next/server';
import { resolveUploadContext } from '@/lib/services/upload-context';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') ?? '';

  try {
    const result = await resolveUploadContext(token);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { context } = result;
    const expiresAt = context.token.expires_at;
    const expiresInSeconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));

    const response = NextResponse.json({
      consultation: {
        id: context.consultation.id,
        name: context.consultation.name,
        phone: context.consultation.phone,
        address: context.consultation.address,
        addressDetail: context.consultation.address_detail
      },
      paymentStage: context.paymentStage
        ? {
            id: context.paymentStage.id,
            status: context.paymentStage.status,
            title: context.paymentStage.stage_template?.title ?? null,
            requestAmount: context.paymentStage.request_amount,
            paidAmount: context.paymentStage.paid_amount
          }
        : null,
      driveFolder: context.driveFolder
        ? {
            id: context.driveFolder.drive_folder_id,
            name: context.driveFolder.drive_folder_name,
            status: context.driveFolder.status
          }
        : null,
      folders: context.folders.map((folder) => ({
        templateName: folder.templateName,
        displayName: folder.displayName,
        folderId: folder.folderId,
        remainingSlots: folder.remainingSlots,
        uploads: folder.uploads.map((upload) => ({
          id: upload.id,
          fileName: upload.file_name,
          filePath: upload.file_path,
          mimeType: upload.mime_type,
          uploadedAt: upload.uploaded_at,
          thumbnailUrl: upload.thumbnail_url ?? null
        }))
      })),
      token: {
        id: context.token.id,
        expiresAt,
        expiresInSeconds
      },
      dryRun: context.dryRun,
      maxFilesPerFolder: context.maxFilesPerFolder,
      audience: context.audience,
      allowedTemplates: context.allowedTemplates
    });

    // Prevent all caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('[upload/validate] unexpected error', error);
    return NextResponse.json({ error: '업로드 링크를 확인하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
