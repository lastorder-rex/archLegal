import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { isDriveDryRun } from '@/lib/google/drive-client';

export const MAX_FILES_PER_FOLDER = 2;
const ALLOWED_CUSTOMER_FOLDER_NAMES = ['1. 인감증명서', '2. 위임장'];

type UploadTokenRow = {
  id: string;
  token: string;
  status: string;
  expires_at: string;
  consultation_id: string;
  payment_id: string | null;
  drive_folder_id: string | null;
};

type ConsultationRow = {
  id: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  address_detail: string | null;
};

type PaymentStageRow = {
  id: string;
  status: string;
  request_amount: number | null;
  paid_amount: number | null;
  stage_template_id: string | null;
  stage_template: {
    id: string;
    title: string;
  } | null;
};

type DriveFolderRow = {
  id: string;
  drive_folder_id: string | null;
  drive_folder_name: string | null;
  status: string | null;
  metadata: Record<string, any> | null;
};

type UploadLogRow = {
  id: string;
  file_name: string;
  file_path: string | null;
  mime_type: string | null;
  uploaded_at: string;
};

export type UploadFolderInfo = {
  templateName: string;
  displayName: string;
  folderId: string | null;
  uploads: UploadLogRow[];
  remainingSlots: number;
};

export type UploadContext = {
  token: UploadTokenRow;
  consultation: ConsultationRow;
  paymentStage: PaymentStageRow | null;
  driveFolder: DriveFolderRow | null;
  folders: UploadFolderInfo[];
  dryRun: boolean;
};

export type UploadContextResult =
  | { ok: true; context: UploadContext }
  | { ok: false; status: number; error: string };

function stripFolderPrefix(name: string): string {
  return name.replace(/^\d+\.\s*/, '').trim();
}

function now(): Date {
  return new Date();
}

export async function resolveUploadContext(token: string): Promise<UploadContextResult> {
  if (!token) {
    return { ok: false, status: 400, error: '토큰이 필요합니다.' };
  }

  const supabase = getSupabaseAdminClient();

  const tokenRow = await fetchUploadToken(supabase, token);
  if (!tokenRow) {
    return { ok: false, status: 404, error: '업로드 링크를 찾을 수 없습니다.' };
  }

  const nowTime = now().getTime();
  const expiresAt = new Date(tokenRow.expires_at).getTime();

  if (tokenRow.status === 'revoked') {
    return { ok: false, status: 410, error: '링크가 취소되었습니다. 관리자에게 문의해주세요.' };
  }

  if (expiresAt <= nowTime || tokenRow.status === 'expired') {
    if (tokenRow.status !== 'expired') {
      await markTokenExpired(supabase, tokenRow.id);
    }
    return { ok: false, status: 410, error: '업로드 링크 이용 시간이 만료되었습니다.' };
  }

  const consultation = await fetchConsultation(supabase, tokenRow.consultation_id);
  if (!consultation) {
    return { ok: false, status: 404, error: '상담 정보를 찾을 수 없습니다.' };
  }

  const paymentStage = tokenRow.payment_id
    ? await fetchPaymentStage(supabase, tokenRow.payment_id)
    : null;

  const driveFolder = tokenRow.payment_id
    ? await fetchDriveFolder(supabase, tokenRow.payment_id)
    : null;

  const logs = await fetchUploadLogs(supabase, tokenRow.consultation_id, tokenRow.payment_id);

  const templates = extractTemplates(driveFolder);
  const folders = templates
    .filter((template) => ALLOWED_CUSTOMER_FOLDER_NAMES.includes(template.name))
    .map((template) => {
      const uploads = logs.filter((log) => log.file_path?.startsWith(`${template.name}/`));
      return {
        templateName: template.name,
        displayName: stripFolderPrefix(template.name),
        folderId: template.folderId ?? null,
        uploads,
        remainingSlots: Math.max(0, MAX_FILES_PER_FOLDER - uploads.length)
      };
    });

  if (folders.length === 0) {
    return { ok: false, status: 500, error: '업로드 가능한 폴더 구성이 존재하지 않습니다. 관리자에게 문의해주세요.' };
  }

  const dryRun = isDriveDryRun() || !driveFolder?.drive_folder_id;

  return {
    ok: true,
    context: {
      token: tokenRow,
      consultation,
      paymentStage,
      driveFolder,
      folders,
      dryRun
    }
  };
}

async function fetchUploadToken(supabase: SupabaseClient, token: string): Promise<UploadTokenRow | null> {
  const { data, error } = await supabase
    .from('upload_tokens')
    .select('id, token, status, expires_at, consultation_id, payment_id, drive_folder_id')
    .eq('token', token)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as UploadTokenRow | null;
}

async function markTokenExpired(supabase: SupabaseClient, tokenId: string) {
  await supabase
    .from('upload_tokens')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('id', tokenId);
}

async function fetchConsultation(supabase: SupabaseClient, consultationId: string): Promise<ConsultationRow | null> {
  const { data, error } = await supabase
    .from('consultations')
    .select('id, name, phone, address, address_detail')
    .eq('id', consultationId)
    .eq('is_del', 'N')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ConsultationRow | null;
}

async function fetchPaymentStage(supabase: SupabaseClient, paymentStageId: string): Promise<PaymentStageRow | null> {
  const { data, error } = await supabase
    .from('user_payment_stages')
    .select(`
      id,
      status,
      request_amount,
      paid_amount,
      stage_template_id,
      stage_template:payment_stage_templates(id, title)
    `)
    .eq('id', paymentStageId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as PaymentStageRow | null;
}

async function fetchDriveFolder(supabase: SupabaseClient, paymentStageId: string): Promise<DriveFolderRow | null> {
  const { data, error } = await supabase
    .from('consultation_drive_folders')
    .select('id, drive_folder_id, drive_folder_name, status, metadata')
    .eq('user_payment_stage_id', paymentStageId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as DriveFolderRow | null;
}

async function fetchUploadLogs(
  supabase: SupabaseClient,
  consultationId: string,
  paymentStageId: string | null
): Promise<UploadLogRow[]> {
  let query = supabase
    .from('upload_logs')
    .select('id, file_name, file_path, mime_type, uploaded_at')
    .eq('consultation_id', consultationId)
    .order('uploaded_at', { ascending: false });

  if (paymentStageId) {
    query = query.eq('payment_id', paymentStageId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as UploadLogRow[];
}

function extractTemplates(driveFolder: DriveFolderRow | null): Array<{ name: string; folderId: string | null }> {
  const templates = driveFolder?.metadata?.templates;
  if (!Array.isArray(templates)) {
    return [];
  }

  return templates
    .filter((template) => typeof template?.name === 'string')
    .map((template) => ({
      name: template.name as string,
      folderId: template.folderId ?? template.folder_id ?? null
    }));
}
