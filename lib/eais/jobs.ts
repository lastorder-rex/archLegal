import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';

export const EAIS_DOC_TYPES = ['auto', '표제부', '전유부', '총괄표제부'] as const;
export const EAIS_DELIVERIES = ['drive', 'email', 'both'] as const;
export const EAIS_JOB_STATUSES = ['pending', 'claimed', 'running', 'done', 'failed', 'cancelled'] as const;

export type EaisDocType = (typeof EAIS_DOC_TYPES)[number];
export type EaisDelivery = (typeof EAIS_DELIVERIES)[number];
export type EaisJobStatus = (typeof EAIS_JOB_STATUSES)[number];

export type EaisIssueJob = {
  id: string;
  requested_by_admin_id: string | null;
  source: string;
  consultation_id: string | null;
  address: string;
  doc_type: EaisDocType;
  dong_ho: string | null;
  delivery: EaisDelivery;
  email: string | null;
  status: EaisJobStatus;
  worker_id: string | null;
  error_message: string | null;
  result_summary: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  claimed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

export type EaisIssueJobFile = {
  id: string;
  job_id: string;
  file_type: string;
  file_name: string | null;
  local_path: string | null;
  drive_file_id: string | null;
  drive_url: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

const createJobSchema = z.object({
  address: z.string().trim().min(1, '주소를 입력해주세요.'),
  docType: z.enum(EAIS_DOC_TYPES).default('auto'),
  dongHo: z.string().trim().optional().default(''),
  delivery: z.enum(EAIS_DELIVERIES).default('drive'),
  email: z.string().trim().email('이메일 형식이 올바르지 않습니다.').optional().or(z.literal('')).default(''),
  requestedByAdminId: z.string().uuid().nullable().optional(),
  source: z.enum(['manual_gpt', 'manual_admin', 'consultation']).default('manual_gpt'),
  consultationId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const registerFileSchema = z.object({
  type: z.enum(['building_register_pdf', 'building_register_total_pdf', 'extracted_html', 'permit_form_pdf']),
  fileName: z.string().trim().optional(),
  localPath: z.string().trim().optional(),
  driveFileId: z.string().trim().optional(),
  driveUrl: z.string().trim().url().optional().or(z.literal('')),
  mimeType: z.string().trim().optional(),
  fileSize: z.number().int().nonnegative().optional(),
});

export type CreateEaisIssueJobInput = z.input<typeof createJobSchema>;
export type RegisterEaisIssueJobFileInput = z.input<typeof registerFileSchema>;

function mapJob(row: any): EaisIssueJob {
  return row as EaisIssueJob;
}

function mapFile(row: any): EaisIssueJobFile {
  return row as EaisIssueJobFile;
}

function publicJob(job: EaisIssueJob) {
  return {
    id: job.id,
    address: job.address,
    docType: job.doc_type,
    dongHo: job.dong_ho ?? '',
    delivery: job.delivery,
    email: job.email ?? '',
    status: job.status,
    workerId: job.worker_id,
    errorMessage: job.error_message,
    resultSummary: job.result_summary,
    createdAt: job.created_at,
    claimedAt: job.claimed_at,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    updatedAt: job.updated_at,
  };
}

function publicFile(file: EaisIssueJobFile) {
  return {
    id: file.id,
    jobId: file.job_id,
    type: file.file_type,
    fileName: file.file_name,
    localPath: file.local_path,
    driveFileId: file.drive_file_id,
    driveUrl: file.drive_url,
    mimeType: file.mime_type,
    fileSize: file.file_size,
    createdAt: file.created_at,
  };
}

async function insertLog(jobId: string, level: 'info' | 'warn' | 'error', message: string) {
  const supabase = getSupabaseAdminClient();
  await supabase.from('eais_issue_job_logs').insert({
    job_id: jobId,
    level,
    message,
  });
}

export async function createEaisIssueJob(input: CreateEaisIssueJobInput) {
  const parsed = createJobSchema.parse(input);

  if (parsed.docType === '전유부' && !parsed.dongHo) {
    throw new Error('전유부 발급은 동/호 정보를 입력해야 합니다.');
  }

  if ((parsed.delivery === 'email' || parsed.delivery === 'both') && !parsed.email) {
    throw new Error('이메일 전달을 선택한 경우 받을 이메일이 필요합니다.');
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('eais_issue_jobs')
    .insert({
      requested_by_admin_id: parsed.requestedByAdminId ?? null,
      source: parsed.source,
      consultation_id: parsed.consultationId ?? null,
      address: parsed.address,
      doc_type: parsed.docType,
      dong_ho: parsed.dongHo || null,
      delivery: parsed.delivery,
      email: parsed.email || null,
      status: 'pending',
      metadata: parsed.metadata ?? {},
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`발급 작업 생성 실패: ${error?.message ?? 'unknown error'}`);
  }

  await insertLog(data.id, 'info', '발급 작업이 생성되었습니다.');
  return publicJob(mapJob(data));
}

export async function listRecentEaisIssueJobs(limit = 50) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('eais_issue_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`발급 작업 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []).map((row) => publicJob(mapJob(row)));
}

export async function getEaisIssueJob(jobId: string): Promise<EaisIssueJob | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('eais_issue_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (error) {
    throw new Error(`발급 작업 조회 실패: ${error.message}`);
  }

  return data ? mapJob(data) : null;
}

export async function getEaisIssueJobResult(jobId: string) {
  const supabase = getSupabaseAdminClient();
  const [{ data: job, error: jobError }, { data: files, error: filesError }] = await Promise.all([
    supabase.from('eais_issue_jobs').select('*').eq('id', jobId).maybeSingle(),
    supabase.from('eais_issue_job_files').select('*').eq('job_id', jobId).order('created_at', { ascending: true }),
  ]);

  if (jobError) {
    throw new Error(`발급 작업 조회 실패: ${jobError.message}`);
  }
  if (filesError) {
    throw new Error(`발급 파일 조회 실패: ${filesError.message}`);
  }
  if (!job) {
    return null;
  }

  return {
    job: publicJob(mapJob(job)),
    files: (files ?? []).map((row) => publicFile(mapFile(row))),
  };
}

export async function claimNextEaisIssueJob(workerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc('claim_next_eais_issue_job', {
    p_worker_id: workerId,
  });

  if (error) {
    throw new Error(`다음 발급 작업 claim 실패: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row?.id ? publicJob(mapJob(row)) : null;
}

export async function startEaisIssueJob(jobId: string, workerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('eais_issue_jobs')
    .update({
      status: 'running',
      worker_id: workerId,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .in('status', ['claimed', 'running'])
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(`발급 작업 시작 처리 실패: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  await insertLog(jobId, 'info', `${workerId} 작업자가 발급을 시작했습니다.`);
  return publicJob(mapJob(data));
}

export async function registerEaisIssueJobFiles(
  jobId: string,
  files: RegisterEaisIssueJobFileInput[],
  workerId: string
) {
  const parsed = z.array(registerFileSchema).min(1, '등록할 파일이 필요합니다.').parse(files);
  const supabase = getSupabaseAdminClient();

  const rows = parsed.map((file) => ({
    job_id: jobId,
    file_type: file.type,
    file_name: file.fileName ?? null,
    local_path: file.localPath ?? null,
    drive_file_id: file.driveFileId ?? null,
    drive_url: file.driveUrl || null,
    mime_type: file.mimeType ?? null,
    file_size: file.fileSize ?? null,
  }));

  const { data, error } = await supabase
    .from('eais_issue_job_files')
    .insert(rows)
    .select('*');

  if (error) {
    throw new Error(`발급 결과 파일 등록 실패: ${error.message}`);
  }

  await insertLog(jobId, 'info', `${workerId} 작업자가 결과 파일 ${rows.length}개를 등록했습니다.`);
  return (data ?? []).map((row) => publicFile(mapFile(row)));
}

export async function completeEaisIssueJob(
  jobId: string,
  input: { workerId: string; resultSummary?: Record<string, unknown> }
) {
  const now = new Date().toISOString();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('eais_issue_jobs')
    .update({
      status: 'done',
      worker_id: input.workerId,
      result_summary: input.resultSummary ?? {},
      completed_at: now,
      updated_at: now,
    })
    .eq('id', jobId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(`발급 작업 완료 처리 실패: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  await insertLog(jobId, 'info', '발급 작업이 완료되었습니다.');
  return publicJob(mapJob(data));
}

export async function failEaisIssueJob(jobId: string, errorMessage: string, workerId?: string) {
  const now = new Date().toISOString();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('eais_issue_jobs')
    .update({
      status: 'failed',
      worker_id: workerId ?? null,
      error_message: errorMessage,
      completed_at: now,
      updated_at: now,
    })
    .eq('id', jobId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(`발급 작업 실패 처리 실패: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  await insertLog(jobId, 'error', errorMessage);
  return publicJob(mapJob(data));
}
