import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { isDriveDryRun } from '@/lib/google/drive-client';

export type UploadAudience = 'customer' | 'staff';

export const DEFAULT_ALLOWED_TEMPLATES: Record<UploadAudience, string[]> = {
  customer: ['1. 인감증명서', '2. 위임장'],
  staff: ['3. 현장 실사', '현장 실사', '3. 현장실사', '현장실사']
};

export const DEFAULT_MAX_FILES_PER_FOLDER: Record<UploadAudience, number> = {
  customer: 4,
  staff: 20
};

type UploadTokenRow = {
  id: string;
  token: string;
  status: string;
  expires_at: string;
  consultation_id: string;
  payment_id: string | null;
  drive_folder_id: string | null;
  audience?: UploadAudience | null;
  scope?: Record<string, unknown> | null;
  max_files_per_folder?: number | null;
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
  audience: UploadAudience;
  allowedTemplates: string[];
  maxFilesPerFolder: number;
};

export type UploadContextResult =
  | { ok: true; context: UploadContext }
  | { ok: false; status: number; error: string };

function stripFolderPrefix(name: string): string {
  return name.replace(/^\d+\.\s*/, '').trim();
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

  const nowTime = Date.now();
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

  let driveFolder = tokenRow.payment_id
    ? await fetchDriveFolder(supabase, { paymentStageId: tokenRow.payment_id })
    : null;

  if (!driveFolder && tokenRow.drive_folder_id) {
    driveFolder = await fetchDriveFolder(supabase, { driveFolderId: tokenRow.drive_folder_id });
  }

  const logs = await fetchUploadLogs(supabase, tokenRow.consultation_id, tokenRow.payment_id, tokenRow.token, tokenRow.id);
  if (process.env.NODE_ENV === 'development') {
    console.debug('[resolveUploadContext] logs fetched', { logCount: logs.length });
  }

  const audience = normalizeAudience(tokenRow.audience);
  const allowedTemplates = resolveAllowedTemplates(tokenRow.scope, audience);
  const allowedTemplateKeys = new Set(allowedTemplates.map(resolveTemplateKey));

  const templates = extractTemplates(driveFolder);
  const folderLimit = resolveMaxFilesPerFolder(tokenRow.max_files_per_folder, audience);

  const remainingLogs = new Map(logs.map((log) => [log.id, log]));

  let folders = templates
    .filter((template) => {
      const key = resolveTemplateKey(template.name);
      return allowedTemplateKeys.size === 0 || allowedTemplateKeys.has(key);
    })
    .map((template) => {
      const templateKey = resolveTemplateKey(template.name);
      const matchedLogs: UploadLogRow[] = [];

      for (const [logId, log] of Array.from(remainingLogs.entries())) {
        const prefix = extractTemplatePrefix(log.file_path);
        if (!prefix) continue;
        if (resolveTemplateKey(prefix) === templateKey) {
          matchedLogs.push(log);
          remainingLogs.delete(logId);
        }
      }

      return {
        templateName: template.name,
        displayName: stripFolderPrefix(canonicalizeTemplateName(template.name)),
        folderId: template.folderId ?? null,
        uploads: matchedLogs,
        remainingSlots: Math.max(0, folderLimit - matchedLogs.length)
      };
    });

  if (folders.length === 0) {
    const fallbackTemplates = allowedTemplates.length > 0 ? allowedTemplates : ['업로드'];
    folders = fallbackTemplates.map((name, index) => {
      const canonicalName = canonicalizeTemplateName(name) || name;
      const templateKey = resolveTemplateKey(canonicalName);
      const matchedLogs = logs.filter((log) => {
        const prefix = extractTemplatePrefix(log.file_path);
        if (!prefix) return false;
        return resolveTemplateKey(prefix) === templateKey;
      });

      matchedLogs.forEach((log) => remainingLogs.delete(log.id));

      return {
        templateName: canonicalName,
        displayName: stripFolderPrefix(canonicalName) || `업로드 ${index + 1}`,
        folderId: null,
        uploads: matchedLogs,
        remainingSlots: Math.max(0, folderLimit - matchedLogs.length)
      };
    });
  }

  // Log unmatched files instead of adding to fallback folder
  if (remainingLogs.size > 0) {
    console.warn('[resolveUploadContext] Unmatched upload logs:', Array.from(remainingLogs.values()).map(l => ({ id: l.id, filePath: l.file_path })));
  }

  const dryRun = isDriveDryRun();

  return {
    ok: true,
    context: {
      token: tokenRow,
      consultation,
      paymentStage,
      driveFolder,
      folders,
      dryRun,
      audience,
      allowedTemplates,
      maxFilesPerFolder: folderLimit
    }
  };
}

async function fetchUploadToken(supabase: SupabaseClient, token: string): Promise<UploadTokenRow | null> {
  const { data, error } = await supabase
    .from('upload_tokens')
    .select('id, token, status, expires_at, consultation_id, payment_id, drive_folder_id, audience, scope, max_files_per_folder')
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

type DriveFolderLookup = { paymentStageId: string } | { driveFolderId: string };

async function fetchDriveFolder(
  supabase: SupabaseClient,
  lookup: DriveFolderLookup
): Promise<DriveFolderRow | null> {
  let query = supabase
    .from('consultation_drive_folders')
    .select('id, drive_folder_id, drive_folder_name, status, metadata');

  if ('paymentStageId' in lookup) {
    query = query.eq('user_payment_stage_id', lookup.paymentStageId);
  } else {
    query = query.eq('drive_folder_id', lookup.driveFolderId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data as DriveFolderRow | null;
}

async function fetchUploadLogs(
  supabase: SupabaseClient,
  consultationId: string,
  paymentStageId: string | null,
  tokenValue: string,
  tokenId: string
): Promise<UploadLogRow[]> {
  let query = supabase
    .from('upload_logs')
    .select('id, file_name, file_path, mime_type, uploaded_at')
    .eq('consultation_id', consultationId);

  if (paymentStageId) {
    query = query.eq('payment_id', paymentStageId);
  } else {
    const orFilters: string[] = [];
    if (tokenValue) {
      orFilters.push(`upload_token.eq.${tokenValue}`);
    }
    if (tokenId) {
      orFilters.push(`upload_token_id.eq.${tokenId}`);
    }

    if (orFilters.length > 0) {
      query = query.or(orFilters.join(','));
    }
  }

  const { data, error } = await query.order('uploaded_at', { ascending: false });

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

export function normalizeAudience(input: unknown): UploadAudience {
  return input === 'staff' ? 'staff' : 'customer';
}

export function resolveAllowedTemplates(scope: unknown, audience: UploadAudience): string[] {
  if (scope && typeof scope === 'object') {
    const rawAllowed = (scope as { allowedTemplates?: unknown }).allowedTemplates;
    if (Array.isArray(rawAllowed)) {
      const cleaned = rawAllowed.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
      if (cleaned.length > 0) {
        return canonicalizeAllowedTemplates(cleaned);
      }
    }
  }
  return canonicalizeAllowedTemplates(DEFAULT_ALLOWED_TEMPLATES[audience]);
}

export function resolveMaxFilesPerFolder(value: unknown, audience: UploadAudience): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.floor(numeric);
  }
  return DEFAULT_MAX_FILES_PER_FOLDER[audience];
}

const TEMPLATE_CANONICAL_MAP: Record<string, string> = {
  현장실사: '현장 실사'
};

function normalizeTemplateKey(value: string): string {
  return value.replace(/^\d+\.\s*/, '').replace(/\s+/g, '').toLowerCase();
}

function canonicalizeTemplateName(value: string): string {
  const trimmed = value.replace(/\/+$/, '').trim();
  if (!trimmed) return trimmed;
  const key = normalizeTemplateKey(trimmed);
  return TEMPLATE_CANONICAL_MAP[key] ?? trimmed;
}

function resolveTemplateKey(value: string): string {
  return normalizeTemplateKey(canonicalizeTemplateName(value));
}

export function canonicalizeAllowedTemplates(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const canonical = canonicalizeTemplateName(value);
    if (!canonical) return;
    const key = resolveTemplateKey(canonical);
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(canonical);
    }
  });
  return result;
}

function extractTemplatePrefix(filePath: string | null): string | null {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, '/');
  const [prefix] = normalized.split('/');
  if (!prefix) return null;
  return canonicalizeTemplateName(prefix);
}
