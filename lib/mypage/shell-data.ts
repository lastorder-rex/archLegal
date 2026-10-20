import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { ConsultationSummary } from '@/types/mypage';
import type { UserProfile } from '@/types/profile';
import { USER_PROFILE_COLUMNS, buildFallbackProfile } from '@/lib/auth/user-profile';

export type MyPageShellData = {
  profile: UserProfile;
  fallbackEmail: string | null;
  consultations: ConsultationSummary[];
};

/**
 * MyPageShell 렌더에 필요한 데이터(프로필 + 상담내역)를 조회한다.
 * mypage/layout 과 request/history/layout 이 공유한다.
 */
export async function loadMyPageShellData(
  supabase: SupabaseClient,
  session: Session
): Promise<MyPageShellData> {
  const { data: profileRow } = await supabase
    .from('users')
    .select(USER_PROFILE_COLUMNS)
    .eq('auth_id', session.user.id)
    .maybeSingle();

  const profile: UserProfile = profileRow
    ? profileRow
    : buildFallbackProfile(session.user);

  const { data: consultationsRows } = await supabase
    .from('consultations')
    .select(
      'id, created_at, address, address_detail, message, main_purps, tot_area, plat_area, ground_floor_cnt, phone, email, attachments'
    )
    .eq('user_id', session.user.id)
    .eq('is_del', 'N')
    .order('created_at', { ascending: false });

  const consultations: ConsultationSummary[] = consultationsRows ?? [];

  return { profile, fallbackEmail: session.user.email ?? null, consultations };
}
