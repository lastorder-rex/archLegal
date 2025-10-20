import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isUserSessionExpired } from '@/lib/auth/user-session';
import { MyPageShell } from '@/components/mypage/MyPageShell';
import type { ConsultationSummary } from '@/types/mypage';
import type { UserProfile } from '@/types/profile';

export const revalidate = 0;

type MyPageLayoutProps = {
  children: React.ReactNode;
};

export default async function MyPageLayout({ children }: MyPageLayoutProps) {
  const cookieStore = cookies();

  if (isUserSessionExpired(cookieStore)) {
    redirect('/login?redirect=/mypage');
  }

  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    redirect('/login?redirect=/mypage');
  }

  const { data: profileRow } = await supabase
    .from('users')
    .select(
      'auth_id, full_name, email, phone, legal_name, contact_phone, profile_completed, profile_completed_at, consent_terms_at, consent_privacy_at, contact_phone_verified_at, birth_date'
    )
    .eq('auth_id', session.user.id)
    .maybeSingle();

  const profile: UserProfile = profileRow
    ? profileRow
    : {
        auth_id: session.user.id,
        full_name:
          (session.user.user_metadata?.name ||
            session.user.user_metadata?.full_name ||
            session.user.email) ?? null,
        email: session.user.email ?? null,
        phone: session.user.phone ?? null,
        legal_name: null,
        contact_phone: null,
        profile_completed: false,
        profile_completed_at: null,
        consent_terms_at: null,
        consent_privacy_at: null,
        contact_phone_verified_at: null,
        birth_date: null
      };

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
