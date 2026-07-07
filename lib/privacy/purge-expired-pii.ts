import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 개인정보 보존기간 만료 파기(익명화) 배치 코어 로직.
 *
 * 안전 최우선 설계:
 * - 하드 DELETE 를 절대 하지 않는다. 식별 정보만 null/placeholder 로 익명화한다.
 * - 거래기록(user_payment_stages 금액·일자·payment_key)은 회계 목적으로 유지한다.
 * - dryRun(기본 true)에서는 조회·집계만 하고 어떤 행도 수정하지 않는다.
 * - legal_hold=true 이거나 anonymized_at 이 이미 있으면 대상에서 제외한다.
 */

type PurgeOptions = {
  /** 보존기간(년). 마지막 결제일 기준 이 기간이 지나면 파기 대상. 기본 5년. */
  retentionYears?: number;
  /** true(기본)면 조회만, false면 실제 익명화 수행. */
  dryRun?: boolean;
};

export type PurgeExpiredPiiResult = {
  /** 파기 대상으로 식별된 withdrawn 사용자 수 (dry-run/execute 공통). */
  candidates: number;
  /** 실제로 익명화된 users 행 수 (dry-run 이면 0). */
  anonymizedUsers: number;
  /** 실제로 익명화된 consultations 행 수 (dry-run 이면 0). */
  anonymizedConsultations: number;
  /** legal_hold 로 인해 건너뛴 사용자 수. */
  skippedLegalHold: number;
  /** 이 시각 이전에 마지막 결제/탈퇴가 이루어진 사용자가 파기 대상 (ISO). */
  cutoffDate: string;
  /** legal_hold/anonymized_at 컬럼 미적용(마이그레이션 전) 여부. */
  purgeColumnsMissing: boolean;
  /** dry-run 여부(호출자 편의). */
  dryRun: boolean;
  /** 처리 중 발생한 개별 오류 메시지(중단 없이 계속 진행). */
  errors: string[];
};

type WithdrawnUserRow = {
  auth_id: string;
  withdrawn_at: string | null;
  legal_hold?: boolean | null;
  anonymized_at?: string | null;
};

const isMissingColumnError = (error: { code?: string } | null | undefined) => error?.code === '42703';

/** 익명화 시 users 에서 비식별화하는 개인정보 컬럼 목록. */
export const ANONYMIZED_USER_FIELDS = [
  'full_name',
  'email',
  'phone',
  'legal_name',
  'contact_phone',
  'birth_date'
] as const;

/** 익명화 시 consultations 에서 비식별화하는 개인정보 컬럼 목록(금액/면적/일자는 유지). */
export const ANONYMIZED_CONSULTATION_FIELDS = [
  'nickname',
  'name',
  'phone',
  'email',
  'address',
  'address_detail',
  'address_code',
  'building_info',
  'message',
  'attachments'
] as const;

function subtractYears(from: Date, years: number): Date {
  const d = new Date(from.getTime());
  d.setFullYear(d.getFullYear() - years);
  return d;
}

/**
 * 사용자의 파기 기준일 계산: user_payment_stages 의 MAX(paid_at).
 * paid_at 이 하나도 없으면 withdrawn_at 을 기준으로 사용한다.
 */
async function resolveReferenceDate(
  admin: SupabaseClient,
  authId: string,
  withdrawnAt: string | null
): Promise<string | null> {
  const { data, error } = await admin
    .from('user_payment_stages')
    .select('paid_at')
    .eq('user_id', authId)
    .not('paid_at', 'is', null)
    .order('paid_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`결제 이력 조회 실패(user ${authId}): ${error.message}`);
  }

  const latestPaidAt = data?.[0]?.paid_at ?? null;
  return latestPaidAt ?? withdrawnAt;
}

async function anonymizeUser(
  admin: SupabaseClient,
  authId: string,
  nowIso: string
): Promise<number> {
  const placeholderEmail = `withdrawn+${authId.slice(0, 8)}@removed.local`;

  const { error } = await admin
    .from('users')
    .update({
      full_name: null,
      email: placeholderEmail,
      phone: null,
      legal_name: null,
      contact_phone: null,
      birth_date: null,
      anonymized_at: nowIso,
      updated_at: nowIso
    })
    .eq('auth_id', authId);

  if (error) {
    throw new Error(`users 익명화 실패(user ${authId}): ${error.message}`);
  }

  return 1;
}

async function anonymizeConsultations(
  admin: SupabaseClient,
  authId: string,
  nowIso: string
): Promise<number> {
  const { data, error } = await admin
    .from('consultations')
    .update({
      nickname: null,
      name: null,
      phone: null,
      email: null,
      address: null,
      address_detail: null,
      address_code: null,
      building_info: null,
      message: null,
      attachments: null,
      updated_at: nowIso
    })
    .eq('user_id', authId)
    .select('id');

  if (error) {
    throw new Error(`consultations 익명화 실패(user ${authId}): ${error.message}`);
  }

  return data?.length ?? 0;
}

export async function purgeExpiredPii(
  admin: SupabaseClient,
  options: PurgeOptions = {}
): Promise<PurgeExpiredPiiResult> {
  const retentionYears = options.retentionYears ?? 5;
  const dryRun = options.dryRun ?? true;

  const now = new Date();
  const nowIso = now.toISOString();
  const cutoff = subtractYears(now, retentionYears);
  const cutoffDate = cutoff.toISOString();

  const errors: string[] = [];
  let purgeColumnsMissing = false;

  // withdrawn 사용자 조회. legal_hold/anonymized_at 컬럼이 없으면(42703) 날짜 규칙만으로 폴백.
  let users: WithdrawnUserRow[] = [];

  const primary = await admin
    .from('users')
    .select('auth_id, withdrawn_at, legal_hold, anonymized_at')
    .eq('account_status', 'withdrawn');

  if (primary.error) {
    if (isMissingColumnError(primary.error)) {
      purgeColumnsMissing = true;
      const fallback = await admin
        .from('users')
        .select('auth_id, withdrawn_at')
        .eq('account_status', 'withdrawn');

      if (fallback.error) {
        throw new Error(`withdrawn 사용자 조회 실패(fallback): ${fallback.error.message}`);
      }

      users = (fallback.data ?? []) as WithdrawnUserRow[];
    } else {
      throw new Error(`withdrawn 사용자 조회 실패: ${primary.error.message}`);
    }
  } else {
    users = (primary.data ?? []) as WithdrawnUserRow[];
  }

  let candidates = 0;
  let anonymizedUsers = 0;
  let anonymizedConsultations = 0;
  let skippedLegalHold = 0;

  for (const user of users) {
    // 재실행 방지: 이미 익명화된 사용자는 스킵.
    if (!purgeColumnsMissing && user.anonymized_at) {
      continue;
    }

    // 분쟁/소송 보류.
    if (!purgeColumnsMissing && user.legal_hold) {
      skippedLegalHold += 1;
      continue;
    }

    let referenceDate: string | null;
    try {
      referenceDate = await resolveReferenceDate(admin, user.auth_id, user.withdrawn_at ?? null);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      continue;
    }

    // 기준일이 전혀 없으면(결제·탈퇴일 모두 없음) 안전을 위해 파기하지 않는다.
    if (!referenceDate) {
      continue;
    }

    if (new Date(referenceDate).getTime() >= cutoff.getTime()) {
      // 아직 보존기간 이내.
      continue;
    }

    candidates += 1;

    if (dryRun) {
      continue;
    }

    // execute: 사용자 단위로 익명화. 실패는 로그 남기고 계속.
    try {
      anonymizedConsultations += await anonymizeConsultations(admin, user.auth_id, nowIso);
      anonymizedUsers += await anonymizeUser(admin, user.auth_id, nowIso);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return {
    candidates,
    anonymizedUsers,
    anonymizedConsultations,
    skippedLegalHold,
    cutoffDate,
    purgeColumnsMissing,
    dryRun,
    errors
  };
}
