import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { hashToken } from '@/lib/admin/token-hash';

async function fetchActiveResetToken(token: string) {
  const supabase = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('admin_2fa_reset_tokens')
    .select('id, admin_user_id, expires_at, pending_secret, status')
    .eq('token_hash', hashToken(token))
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('[admin/auth/2fa/reset] token fetch error', error);
    throw new Error('reset-token-fetch-failed');
  }

  if (!data) {
    return null;
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await supabase
      .from('admin_2fa_reset_tokens')
      .update({ status: 'expired', pending_secret: null, updated_at: nowIso })
      .eq('id', data.id);
    return null;
  }

  return data;
}

export async function POST(request: NextRequest) {
  try {
    const { action, token, username, password, code } = await request.json().catch(() => ({}));

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: '재설정 링크가 유효하지 않습니다.' }, { status: 400 });
    }

    const resetToken = await fetchActiveResetToken(token);
    if (!resetToken) {
      return NextResponse.json({ error: '재설정 링크가 만료되었거나 이미 사용되었습니다.' }, { status: 410 });
    }

    const supabase = getSupabaseAdminClient();

    if (action === 'prepare') {
      if (!username || !password) {
        return NextResponse.json({ error: '아이디와 비밀번호를 입력해주세요.' }, { status: 400 });
      }

      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, username, password_hash')
        .eq('id', resetToken.admin_user_id)
        .maybeSingle();

      if (adminError || !adminUser) {
        return NextResponse.json({ error: '관리자 계정을 찾을 수 없습니다.' }, { status: 404 });
      }

      const isUsernameValid = adminUser.username === username;
      const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);

      if (!isUsernameValid || !isPasswordValid) {
        return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
      }

      const secret = speakeasy.generateSecret({
        name: `ArchLegal Admin (${adminUser.username})`,
        issuer: 'ArchLegal'
      });
      const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');
      const nowIso = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('admin_2fa_reset_tokens')
        .update({
          pending_secret: secret.base32,
          identity_verified_at: nowIso,
          updated_at: nowIso
        })
        .eq('id', resetToken.id)
        .eq('status', 'active');

      if (updateError) {
        console.error('[admin/auth/2fa/reset] prepare update error', updateError);
        return NextResponse.json({ error: 'QR 코드를 생성하지 못했습니다.' }, { status: 500 });
      }

      return NextResponse.json({
        qrCode,
        manualEntryKey: secret.base32,
        username: adminUser.username
      });
    }

    if (action === 'confirm') {
      if (!code || typeof code !== 'string') {
        return NextResponse.json({ error: '인증 코드를 입력해주세요.' }, { status: 400 });
      }

      if (!resetToken.pending_secret) {
        return NextResponse.json({ error: '먼저 아이디와 비밀번호를 확인해주세요.' }, { status: 400 });
      }

      const verified = speakeasy.totp.verify({
        secret: resetToken.pending_secret,
        encoding: 'base32',
        token: code,
        window: 2
      });

      if (!verified) {
        return NextResponse.json({ error: '인증 코드가 올바르지 않습니다.' }, { status: 400 });
      }

      const nowIso = new Date().toISOString();
      const { error: adminUpdateError } = await supabase
        .from('admin_users')
        .update({
          two_factor_secret: resetToken.pending_secret,
          two_factor_enabled: true
        })
        .eq('id', resetToken.admin_user_id);

      if (adminUpdateError) {
        console.error('[admin/auth/2fa/reset] admin update error', adminUpdateError);
        return NextResponse.json({ error: '2FA를 재설정하지 못했습니다.' }, { status: 500 });
      }

      const { error: tokenUpdateError } = await supabase
        .from('admin_2fa_reset_tokens')
        .update({
          status: 'used',
          pending_secret: null,
          used_at: nowIso,
          updated_at: nowIso
        })
        .eq('id', resetToken.id);

      if (tokenUpdateError) {
        console.error('[admin/auth/2fa/reset] token update error', tokenUpdateError);
      }

      return NextResponse.json({ message: '2FA가 재설정되었습니다.' });
    }

    return NextResponse.json({ error: '지원하지 않는 요청입니다.' }, { status: 400 });
  } catch (error) {
    console.error('[admin/auth/2fa/reset] error', error);
    return NextResponse.json({ error: '2FA 재설정 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
