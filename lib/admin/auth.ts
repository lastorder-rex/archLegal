import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';

export type AdminAuthResult =
  | { success: true; adminId: string; adminUsername: string }
  | { success: false; error: string; status: number };

/**
 * 관리자 인증 세션 검증
 * 쿠키에서 admin_session을 읽고 DB에서 관리자 정보 확인
 */
export async function verifyAdminSession(): Promise<AdminAuthResult> {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('admin_session');

  if (!adminCookie) {
    return {
      success: false,
      error: '로그인이 필요합니다. 관리자 페이지에서 다시 로그인해주세요.',
      status: 401
    };
  }

  let adminId: string;
  try {
    const sessionData = JSON.parse(adminCookie.value);
    if (!sessionData?.adminId) {
      throw new Error('Invalid session');
    }
    adminId = sessionData.adminId;
  } catch {
    return {
      success: false,
      error: '세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.',
      status: 401
    };
  }

  const supabase = getSupabaseAdminClient();

  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('id, username')
    .eq('id', adminId)
    .single();

  if (adminError || !adminUser) {
    return {
      success: false,
      error: '관리자 계정 정보를 확인할 수 없습니다. 다시 로그인해주세요.',
      status: 401
    };
  }

  return {
    success: true,
    adminId: adminUser.id,
    adminUsername: adminUser.username
  };
}
