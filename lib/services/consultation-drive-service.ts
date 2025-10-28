import type { SupabaseClient } from '@supabase/supabase-js';
import type { drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { getDriveClient, getDriveRootFolderId, getDriveSharedDriveId, isDriveDryRun } from '@/lib/google/drive-client';

type DriveTemplateRow = {
  id: string;
  name: string;
};

type ConsultationRow = {
  id: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  address_detail: string | null;
};

export function sanitizeForFolderName(value: string): string {
  return value.replace(/[\\/]/g, '-').replace(/\s+/g, ' ').trim();
}

function sanitizeForFileName(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatKstTimestamp(date: Date): string {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}${map.month}${map.day}_${map.hour}${map.minute}`;
}

function extractBaseAddress(address: string, addressDetail?: string | null): string {
  let base = address.trim();
  if (addressDetail && addressDetail.trim().length > 0) {
    const detail = addressDetail.trim();
    base = base.replace(detail, '').trim();
  }

  base = base.replace(/\s*\([^)]*\)\s*$/g, '').trim();
  return base;
}

function formatAmountThousands(amount: number): string {
  const thousands = Math.max(0, Math.floor(amount / 1000));
  return new Intl.NumberFormat('ko-KR').format(thousands);
}

function digitsOnly(value: string | null | undefined): string {
  return value ? value.replace(/\D/g, '') : '';
}

function escapeQueryValue(value: string): string {
  return value.replace(/'/g, "\\'");
}

function mergeMetadata(existing: Record<string, unknown> | null, patch: Record<string, unknown>) {
  return {
    ...(existing ?? {}),
    ...patch
  };
}

function shouldUseAllDrives(): boolean {
  const sharedDriveId = getDriveSharedDriveId();
  if (sharedDriveId) return true;
  const explicit = String(process.env.GOOGLE_SUPPORTS_ALL_DRIVES ?? '').toLowerCase();
  return explicit === 'true' || explicit === '1';
}

async function fetchConsultation(
  supabase: SupabaseClient,
  consultationId: string
): Promise<ConsultationRow> {
  const { data, error } = await supabase
    .from('consultations')
    .select('id, name, phone, address, address_detail')
    .eq('id', consultationId)
    .eq('is_del', 'N')
    .single();

  if (error || !data) {
    throw new Error('상담 정보를 불러오지 못했습니다.');
  }

  return data as ConsultationRow;
}

async function fetchActiveTemplates(supabase: SupabaseClient): Promise<DriveTemplateRow[]> {
  const { data, error } = await supabase
    .from('drive_folder_templates')
    .select('id, name')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error('드라이브 폴더 템플릿 정보를 불러오지 못했습니다.');
  }

  return (data ?? []) as DriveTemplateRow[];
}

async function findExistingFolderId(name: string): Promise<string | null> {
  const drive = await getDriveClient();
  const parentId = getDriveRootFolderId();
  const sharedDriveId = getDriveSharedDriveId();
  const useAllDrives = shouldUseAllDrives();

  const listParams = {
    q: `name = '${escapeQueryValue(name)}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    supportsAllDrives: useAllDrives,
    includeItemsFromAllDrives: useAllDrives,
    corpora: useAllDrives && sharedDriveId ? 'drive' : undefined,
    driveId: useAllDrives && sharedDriveId ? sharedDriveId : undefined
  } as any;

  const response = await drive.files.list(listParams);
  const data = (response as any).data;
  const files = data.files ?? [];
  return files.length > 0 ? files[0].id ?? null : null;
}

async function driveFolderExists(folderId: string): Promise<boolean> {
  const drive = await getDriveClient();
  const sharedDriveId = getDriveSharedDriveId();
  const useAllDrives = shouldUseAllDrives();

  try {
    await drive.files.get({
      fileId: folderId,
      fields: 'id',
      supportsAllDrives: useAllDrives
    });
    return true;
  } catch (error) {
    const status = (error as { code?: number; response?: { status?: number } }) ?? {};
    if (status.code === 404 || status.response?.status === 404) {
      return false;
    }
    throw error;
  }
}

async function createDriveFolder(name: string) {
  const drive = await getDriveClient();
  const parentId = getDriveRootFolderId();
  const sharedDriveId = getDriveSharedDriveId();
  const useAllDrives = shouldUseAllDrives();

  const response = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    },
    fields: 'id, name, webViewLink',
    supportsAllDrives: useAllDrives,
    driveId: useAllDrives && sharedDriveId ? sharedDriveId : undefined
  } as any);

  const data = (response as any).data;

  if (!data.id) {
    throw new Error('Google Drive 폴더 ID를 확인할 수 없습니다.');
  }

  return { id: data.id, name: data.name ?? name };
}

async function createSubFolders(parentFolderId: string, templateRows: DriveTemplateRow[]) {
  if (!templateRows.length) {
    return [];
  }

  const drive = await getDriveClient();
  const sharedDriveId = getDriveSharedDriveId();
  const useAllDrives = shouldUseAllDrives();

  const results: Array<{ templateId: string; folderId: string; name: string }> = [];
  for (const template of templateRows) {
    const folderName = sanitizeForFolderName(template.name);
    const response = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      },
      fields: 'id, name',
      supportsAllDrives: useAllDrives,
      driveId: useAllDrives && sharedDriveId ? sharedDriveId : undefined
    } as any);

    const data = (response as any).data;

    if (data.id) {
      results.push({
        templateId: template.id,
        folderId: data.id,
        name: data.name ?? folderName
      });
    }
  }

  return results;
}

type EnsureParams = {
  supabase: SupabaseClient;
  consultationId: string;
  userPaymentStageId: string;
  requestAmount: number;
};

export async function ensureConsultationDriveFolder({
  supabase,
  consultationId,
  userPaymentStageId,
  requestAmount
}: EnsureParams) {
  const { data: existingRow, error: existingError } = await supabase
    .from('consultation_drive_folders')
    .select('id, drive_folder_id, drive_folder_name, status, metadata')
    .eq('consultation_id', consultationId)
    .eq('user_payment_stage_id', userPaymentStageId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingRow?.drive_folder_id) {
    if (existingRow.status === 'active') {
      if (isDriveDryRun()) {
        return {
          rowId: existingRow.id,
          driveFolderId: existingRow.drive_folder_id,
          driveFolderName: existingRow.drive_folder_name,
          status: existingRow.status
        };
      }

      const exists = await driveFolderExists(existingRow.drive_folder_id);
      if (exists) {
        return {
          rowId: existingRow.id,
          driveFolderId: existingRow.drive_folder_id,
          driveFolderName: existingRow.drive_folder_name,
          status: existingRow.status
        };
      }
    }
  }

  const consultation = await fetchConsultation(supabase, consultationId);
  const templates = await fetchActiveTemplates(supabase);

  const customerName = sanitizeForFolderName(consultation.name ?? '미확인고객');
  const baseAddress = sanitizeForFolderName(
    extractBaseAddress(consultation.address ?? '주소미상', consultation.address_detail)
  );
  const phoneDigits = digitsOnly(consultation.phone);

  const amountLabel = formatAmountThousands(requestAmount);
  const baseFolderName = `${customerName}(${amountLabel})_${baseAddress}`;

  const dryRun = isDriveDryRun();
  let finalFolderName = baseFolderName;
  let driveFolderId: string | null = null;
  let subFolders: Array<{ templateId: string; folderId: string; name: string }> = [];

  if (!dryRun) {
    const duplicateExists = await findExistingFolderId(finalFolderName);
    if (duplicateExists) {
      if (phoneDigits) {
        finalFolderName = `${finalFolderName}_${phoneDigits}`;
      } else {
        finalFolderName = `${finalFolderName}_${Date.now()}`;
      }
    }

    const createdFolder = await createDriveFolder(finalFolderName);
    driveFolderId = createdFolder.id;
    subFolders = await createSubFolders(createdFolder.id, templates);
  }

  const metadataPatch: Record<string, unknown> = {
    templates: subFolders,
    dryRun,
    lastSyncedAt: new Date().toISOString()
  };

  const upsertPayload = {
    consultation_id: consultationId,
    user_payment_stage_id: userPaymentStageId,
    drive_folder_id: driveFolderId,
    drive_folder_name: finalFolderName,
    status: dryRun ? 'dry_run' : 'active',
    name_snapshot: consultation.name ?? null,
    address_snapshot: baseAddress,
    phone_snapshot: phoneDigits || null,
    amount_snapshot: requestAmount,
    metadata: mergeMetadata(existingRow?.metadata ?? null, metadataPatch)
  };

  const { data: upsertedRow, error: upsertError } = await supabase
    .from('consultation_drive_folders')
    .upsert(upsertPayload, { onConflict: 'user_payment_stage_id' })
    .select('id, drive_folder_id, drive_folder_name, status')
    .maybeSingle();

  if (upsertError || !upsertedRow) {
    throw upsertError ?? new Error('드라이브 폴더 정보를 저장하지 못했습니다.');
  }

  return {
    rowId: upsertedRow.id,
    driveFolderId: upsertedRow.drive_folder_id,
    driveFolderName: upsertedRow.drive_folder_name,
    status: upsertedRow.status
  };
}

type CancelParams = {
  supabase: SupabaseClient;
  consultationId: string;
  userPaymentStageId: string;
};

export async function cancelConsultationDriveFolder({
  supabase,
  consultationId,
  userPaymentStageId
}: CancelParams) {
  const { data: existingRow, error: existingError } = await supabase
    .from('consultation_drive_folders')
    .select('id, drive_folder_id, drive_folder_name, status, metadata')
    .eq('consultation_id', consultationId)
    .eq('user_payment_stage_id', userPaymentStageId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existingRow) {
    return;
  }

  const dryRun = isDriveDryRun();
  const now = new Date().toISOString();

  if (!existingRow.drive_folder_id || dryRun) {
    await supabase
      .from('consultation_drive_folders')
      .update({
        status: dryRun ? 'dry_run' : 'cancelled',
        cancelled_at: now,
        metadata: mergeMetadata(existingRow.metadata ?? null, {
          lastAction: dryRun ? 'dry_run_cancelled' : 'cancelled',
          cancelledAt: now
        })
      })
      .eq('id', existingRow.id);
    return;
  }

  const drive = await getDriveClient();
  const useAllDrives = shouldUseAllDrives();
  const sharedDriveId = getDriveSharedDriveId();

  try {
    await drive.files.delete({
      fileId: existingRow.drive_folder_id,
      supportsAllDrives: useAllDrives
    });

    await supabase
      .from('consultation_drive_folders')
      .update({
        status: 'deleted',
        cancelled_at: now,
        deleted_at: now,
        metadata: mergeMetadata(existingRow.metadata ?? null, {
          lastAction: 'deleted',
          deletedAt: now
        })
      })
      .eq('id', existingRow.id);
  } catch (error) {
    const status = (error as { code?: number; response?: { status?: number } }) ?? {};
    const isNotFound = status.code === 404 || status.response?.status === 404;

    if (isNotFound) {
      await supabase
        .from('consultation_drive_folders')
        .update({
          status: 'deleted',
          cancelled_at: now,
          deleted_at: now,
          metadata: mergeMetadata(existingRow.metadata ?? null, {
            lastAction: 'deleted',
            deletedAt: now
          })
        })
        .eq('id', existingRow.id);
      return;
    }

    await supabase
      .from('consultation_drive_folders')
      .update({
        status: 'error',
        cancelled_at: now,
        metadata: mergeMetadata(existingRow.metadata ?? null, {
          lastAction: 'delete_failed',
          cancelledAt: now,
          lastError: (error as Error).message
        })
      })
      .eq('id', existingRow.id);

    throw error;
  }
}

type FileUploadParams = {
  folderId: string;
  fileName: string;
  mimeType: string;
  data: Buffer;
};

export type DriveFolderChildSummary = {
  id: string | null;
  name: string;
  hasFiles: boolean | null;
};

export type DriveFolderSummary = {
  fetchedAt: string;
  folders: DriveFolderChildSummary[];
  root: {
    hasFiles: boolean | null;
    sampleFiles: Array<{ id: string; name: string }>;
  };
};

async function checkFolderHasDirectFiles(
  drive: drive_v3.Drive,
  folderId: string,
  useAllDrives: boolean,
  sharedDriveId: string | null
): Promise<boolean> {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
    fields: 'files(id)',
    pageSize: 1,
    supportsAllDrives: useAllDrives,
    includeItemsFromAllDrives: useAllDrives,
    corpora: useAllDrives && sharedDriveId ? 'drive' : undefined,
    driveId: useAllDrives && sharedDriveId ? sharedDriveId : undefined
  } as any);

  return (response.data.files ?? []).length > 0;
}

export async function fetchDriveFolderSummary(folderId: string): Promise<DriveFolderSummary> {
  const drive = await getDriveClient();
  const sharedDriveId = getDriveSharedDriveId();
  const useAllDrives = shouldUseAllDrives();

  const [folderResponse, rootFilesResponse] = await Promise.all([
    drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
      supportsAllDrives: useAllDrives,
      includeItemsFromAllDrives: useAllDrives,
      corpora: useAllDrives && sharedDriveId ? 'drive' : undefined,
      driveId: useAllDrives && sharedDriveId ? sharedDriveId : undefined
    } as any),
    drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
      pageSize: 10,
      supportsAllDrives: useAllDrives,
      includeItemsFromAllDrives: useAllDrives,
      corpora: useAllDrives && sharedDriveId ? 'drive' : undefined,
      driveId: useAllDrives && sharedDriveId ? sharedDriveId : undefined
    } as any)
  ]);

  const rawFolders = folderResponse.data.files ?? [];

  const folders = await Promise.all(
    rawFolders
      .filter((file): file is { id: string; name?: string | null } => Boolean(file.id))
      .map(async (file) => {
        try {
          const hasFiles = await checkFolderHasDirectFiles(drive, file.id!, useAllDrives, sharedDriveId);
          return {
            id: file.id!,
            name: file.name ?? '이름 없는 폴더',
            hasFiles
          };
        } catch (error) {
          console.error('[drive] failed to inspect subfolder files', { folderId: file.id }, error);
          return {
            id: file.id!,
            name: file.name ?? '이름 없는 폴더',
            hasFiles: null
          };
        }
      })
  );

  const rootFiles = (rootFilesResponse.data.files ?? []).filter((file) => Boolean(file.id && file.name));

  return {
    fetchedAt: new Date().toISOString(),
    folders,
    root: {
      hasFiles: rootFiles.length > 0,
      sampleFiles: rootFiles.slice(0, 3).map((file) => ({
        id: file.id as string,
        name: file.name as string
      }))
    }
  };
}

export async function uploadFileToDriveFolder({
  folderId,
  fileName,
  mimeType,
  data
}: FileUploadParams): Promise<{ fileId: string | null; dryRun: boolean }> {
  if (!folderId) {
    throw new Error('대상 Google Drive 폴더 ID가 없습니다.');
  }

  const dryRun = isDriveDryRun();
  if (dryRun) {
    return { fileId: `dry-run-${Date.now()}`, dryRun: true };
  }

  const drive = await getDriveClient();
  const sharedDriveId = getDriveSharedDriveId();
  const useAllDrives = shouldUseAllDrives();

  // Remove files with the same name to support overwrite semantics
  const existing = await drive.files.list({
    q: `name = '${escapeQueryValue(fileName)}' and '${folderId}' in parents and trashed = false`,
    fields: 'files(id)',
    supportsAllDrives: useAllDrives,
    includeItemsFromAllDrives: useAllDrives,
    corpora: useAllDrives && sharedDriveId ? 'drive' : undefined,
    driveId: useAllDrives && sharedDriveId ? sharedDriveId : undefined
  } as any);

  const existingFiles = existing.data.files ?? [];
  for (const file of existingFiles) {
    if (!file.id) continue;
    try {
      await drive.files.delete({
        fileId: file.id,
        supportsAllDrives: useAllDrives,
        driveId: useAllDrives && sharedDriveId ? sharedDriveId : undefined
      } as any);
    } catch (error) {
      console.warn('Failed to delete existing Drive file before overwrite', error);
    }
  }

  const mediaBody = Readable.from(data);
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId]
    },
    media: {
      mimeType,
      body: mediaBody
    },
    fields: 'id, name',
    supportsAllDrives: useAllDrives,
    driveId: useAllDrives && sharedDriveId ? sharedDriveId : undefined
  } as any);

  return {
    fileId: response.data.id ?? null,
    dryRun: false
  };
}

export function buildDriveFileName(categoryLabel: string, customerName: string, originalFileName: string): string {
  const extension = originalFileName.includes('.') ? `.${originalFileName.split('.').pop()}` : '';
  const baseCustomer = sanitizeForFileName(customerName || '고객');
  const baseCategory = sanitizeForFileName(categoryLabel || '자료');
  const timestamp = formatKstTimestamp(new Date());
  return `${baseCategory}_${baseCustomer}_${timestamp}${extension}`;
}
