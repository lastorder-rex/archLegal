import { MyPageShell } from '@/components/mypage/MyPageShell';
import type { ConsultationSummary } from '@/types/mypage';
import type { UserProfile } from '@/types/profile';
import { USER_PROFILE_COLUMNS, buildFallbackProfile } from '@/lib/auth/user-profile';
import { requireUserSession } from '@/lib/auth/require-session';

export const revalidate = 0;

type MyPageLayoutProps = {
  children: React.ReactNode;
};

export default async function MyPageLayout({ children }: MyPageLayoutProps) {
  const { supabase, session } = await requireUserSession('/mypage', { checkAuthError: true });

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

  return (
    <MyPageShell profile={profile} fallbackEmail={session.user.email ?? null} consultations={consultations}>
      {children}
    </MyPageShell>
  );
}
