import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin/auth';
import { purgeExpiredPii } from '@/lib/privacy/purge-expired-pii';
import { createSupabaseAdminClient } from '@/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * 개인정보 보존기간 만료 파기(익명화) 배치 트리거.
 *
 * 인증(둘 중 하나 통과 시 허용):
 *  1) Authorization: Bearer <CRON_SECRET>  (process.env.CRON_SECRET 설정 시)
 *  2) 관리자 세션(verifyAdminSession)
 *  CRON_SECRET 미설정이면 관리자 세션만 허용.
 *
 * 안전장치: 기본은 dry-run. 실제 파기는 ?dryRun=0 을 명시해야 실행된다.
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  const cronAuthorized = Boolean(cronSecret) && bearerToken === cronSecret;

  let authorized = cronAuthorized;
  let actor = 'cron';

  if (!authorized) {
    const adminAuth = await verifyAdminSession();
    if (adminAuth.success) {
      authorized = true;
      actor = `admin:${adminAuth.adminUsername}`;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRunParam = url.searchParams.get('dryRun');
  // 기본은 dry-run. ?dryRun=0 (또는 false/no) 일 때만 실제 실행.
  const dryRun = !(dryRunParam === '0' || dryRunParam === 'false' || dryRunParam === 'no');

  const retentionParam = url.searchParams.get('retentionYears');
  const parsedRetention = retentionParam ? Number(retentionParam) : NaN;
  const retentionYears =
    Number.isFinite(parsedRetention) && parsedRetention > 0 ? parsedRetention : 5;

  try {
    const admin = createSupabaseAdminClient();
    const summary = await purgeExpiredPii(admin, { retentionYears, dryRun });

    console.info(
      `[purge-expired-pii] actor=${actor} dryRun=${dryRun} candidates=${summary.candidates} ` +
        `anonymizedUsers=${summary.anonymizedUsers} skippedLegalHold=${summary.skippedLegalHold} ` +
        `columnsMissing=${summary.purgeColumnsMissing} errors=${summary.errors.length}`
    );

    return NextResponse.json({ success: true, retentionYears, ...summary });
  } catch (error) {
    console.error('[purge-expired-pii] failed', error);
    return NextResponse.json(
      { error: '개인정보 파기 배치 실행 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
