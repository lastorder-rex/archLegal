import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { clearUserSessionCookie, createExpiredSessionResponse, isUserSessionExpired } from '@/lib/auth/user-session';
import { createSupabaseAdminClient } from '@/supabase/admin';

type WithdrawResult = 'deleted' | 'deactivated';
type AccountStatus = 'active' | 'withdrawn' | 'blocked';
type UserRow = { auth_id: string; account_status?: AccountStatus | null };

const ACTIVE_PAYMENT_STATUSES = ['requested', 'awaiting'];
const isMissingColumnError = (error: { code?: string } | null) => error?.code === '42703';

export async function POST() {
  const cookieStore = cookies();

  if (isUserSessionExpired(cookieStore)) {
    return createExpiredSessionResponse();
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const userId = session.user.id;
  const admin = createSupabaseAdminClient();

  let accountStatusSupported = true;
  let userProfile: UserRow | null = null;

  const {
    data: profileWithStatus,
    error: userProfileError
  } = await supabase
    .from('users')
    .select('auth_id, account_status')
    .eq('auth_id', userId)
    .maybeSingle<UserRow>();

  if (userProfileError) {
    if (isMissingColumnError(userProfileError)) {
      accountStatusSupported = false;
      console.warn('users.account_status column missing. Run latest migrations. Falling back to legacy behavior.');
      const {
        data: fallbackProfile,
        error: fallbackError
      } = await supabase
        .from('users')
        .select('auth_id')
        .eq('auth_id', userId)
        .maybeSingle<UserRow>();

      if (fallbackError) {
        console.error('Failed to load user profile (fallback) before withdrawal', fallbackError);
        return NextResponse.json({ error: '회원 정보를 확인할 수 없습니다.' }, { status: 500 });
      }

      userProfile = fallbackProfile;
    } else {
      console.error('Failed to load user profile before withdrawal', userProfileError);
      return NextResponse.json({ error: '회원 정보를 확인할 수 없습니다.' }, { status: 500 });
    }
  } else {
    userProfile = profileWithStatus;
  }

  if (!userProfile) {
    // If the profile row is already missing, best-effort delete auth user and return success
    await admin.auth.admin.deleteUser(userId).catch(error => {
      console.error('Failed to delete auth user after missing profile', error);
    });
    const response = NextResponse.json({ success: true, result: 'deleted' as WithdrawResult });
    clearUserSessionCookie(response);
    return response;
  }

  if (accountStatusSupported && userProfile?.account_status === 'blocked') {
    return NextResponse.json(
      { error: '페널티 조치 중인 계정은 탈퇴할 수 없습니다. 관리자에게 문의해주세요.' },
      { status: 403 }
    );
  }

  const { count: activePaymentCount, error: activePaymentError } = await supabase
    .from('user_payment_stages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ACTIVE_PAYMENT_STATUSES)
    .is('paid_at', null);

  if (activePaymentError) {
    console.error('Failed to check active payment stages', activePaymentError);
    return NextResponse.json({ error: '진행 중인 거래 정보를 확인하지 못했습니다.' }, { status: 500 });
  }

  if ((activePaymentCount ?? 0) > 0) {
    return NextResponse.json(
      { error: '진행 중인 거래건이 있어 탈퇴할 수 없습니다. 담당 매니저에게 문의해주세요.' },
      { status: 409 }
    );
  }

  const { count: paidStageCount, error: paidStageError } = await supabase
    .from('user_payment_stages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('paid_at', 'is', null);

  if (paidStageError) {
    console.error('Failed to check payment history before withdrawal', paidStageError);
    return NextResponse.json({ error: '결제 이력 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }

  const hasPaidHistory = (paidStageCount ?? 0) > 0;
  const now = new Date().toISOString();
  let result: WithdrawResult = 'deleted';

  if (accountStatusSupported && hasPaidHistory) {
    const { error: updateError } = await admin
      .from('users')
      .update({
        account_status: 'withdrawn',
        withdrawn_at: now,
        updated_at: now
      })
      .eq('auth_id', userId);

    if (updateError) {
      console.error('Failed to mark user as withdrawn', updateError);
      return NextResponse.json({ error: '탈퇴 처리에 실패했습니다.' }, { status: 500 });
    }

    const { error: deactivateRoleError } = await admin.from('user_roles').delete().eq('user_id', userId);
    if (deactivateRoleError) {
      console.error('Failed to delete user roles during withdrawal', deactivateRoleError);
    }

    result = 'deactivated';
  } else {
    if (hasPaidHistory && !accountStatusSupported) {
      console.warn('Paid user withdrawal fallback triggered without account_status column; deleting user data.');
    }

    // Remove consultations and roles before deleting the user row
    const { error: consultationsDeleteError } = await admin.from('consultations').delete().eq('user_id', userId);
    if (consultationsDeleteError) {
      console.error('Failed to delete consultations during withdrawal', consultationsDeleteError);
    }

    const { error: roleDeleteError } = await admin.from('user_roles').delete().eq('user_id', userId);
    if (roleDeleteError) {
      console.error('Failed to delete user roles during withdrawal', roleDeleteError);
    }

    const { error: deleteUserError } = await admin
      .from('users')
      .delete()
      .eq('auth_id', userId);

    if (deleteUserError) {
      console.error('Failed to delete user account', deleteUserError);
      return NextResponse.json({ error: '탈퇴 처리에 실패했습니다.' }, { status: 500 });
    }

    result = 'deleted';
  }

  await admin.auth.admin.deleteUser(userId).catch(error => {
    console.error('Failed to delete auth user during withdrawal', error);
  });

  await supabase.auth.signOut().catch(error => {
    console.error('Failed to clear Supabase session during withdrawal', error);
  });

  const response = NextResponse.json({ success: true, result });
  clearUserSessionCookie(response);
  return response;
}
