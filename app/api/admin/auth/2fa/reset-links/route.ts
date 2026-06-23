import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { verifyAdminSession } from '@/lib/utils/admin-auth';

const DEFAULT_EXPIRY_HOURS = 24;
const MAX_EXPIRY_HOURS = 72;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function buildResetUrl(request: NextRequest, token: string) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  const baseUrl = configuredBaseUrl || request.nextUrl.origin;
  return `${baseUrl.replace(/\/$/, '')}/supercore/2fa-reset?token=${encodeURIComponent(token)}`;
}

function computeExpiresAt(expiresInHours: unknown) {
  const parsedHours = Number(expiresInHours);
  const safeHours = Number.isFinite(parsedHours)
    ? Math.min(Math.max(parsedHours, 1), MAX_EXPIRY_HOURS)
    : DEFAULT_EXPIRY_HOURS;

  return new Date(Date.now() + safeHours * 60 * 60 * 1000).toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { targetAdminId, expiresInHours } = await request.json().catch(() => ({}));
    if (!targetAdminId) {
      return NextResponse.json({ error: '관리자 계정을 선택해주세요.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: targetAdmin, error: targetAdminError } = await supabase
      .from('admin_users')
      .select('id, username')
      .eq('id', targetAdminId)
      .maybeSingle();

    if (targetAdminError || !targetAdmin) {
      return NextResponse.json({ error: '관리자 계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    await supabase
      .from('admin_2fa_reset_tokens')
      .update({
        status: 'expired',
        pending_secret: null,
        updated_at: nowIso
      })
      .eq('status', 'active')
      .lt('expires_at', nowIso);

    await supabase
      .from('admin_2fa_reset_tokens')
      .update({
        status: 'revoked',
        pending_secret: null,
        updated_at: nowIso
      })
      .eq('admin_user_id', targetAdmin.id)
      .eq('status', 'active');

    let token = randomBytes(32).toString('base64url');
    let insertedRow: { expires_at: string } | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error } = await supabase
        .from('admin_2fa_reset_tokens')
        .insert({
          admin_user_id: targetAdmin.id,
          token_hash: hashToken(token),
          status: 'active',
          expires_at: computeExpiresAt(expiresInHours),
          created_by: auth.adminId,
          created_at: nowIso,
          updated_at: nowIso
        })
        .select('expires_at')
        .maybeSingle();

      if (!error && data) {
        insertedRow = data;
        break;
      }

      if ((error as { code?: string } | null)?.code === '23505') {
        token = randomBytes(32).toString('base64url');
        continue;
      }

      console.error('[admin/auth/2fa/reset-links] insert error', error);
      return NextResponse.json({ error: '2FA 재설정 링크를 생성하지 못했습니다.' }, { status: 500 });
    }

    if (!insertedRow) {
      return NextResponse.json({ error: '2FA 재설정 링크를 생성하지 못했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      resetUrl: buildResetUrl(request, token),
      expiresAt: insertedRow.expires_at,
      username: targetAdmin.username
    });
  } catch (error) {
    console.error('[admin/auth/2fa/reset-links] error', error);
    return NextResponse.json({ error: '2FA 재설정 링크 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
