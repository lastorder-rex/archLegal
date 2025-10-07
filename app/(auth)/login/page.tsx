import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import AuthPanel from '@/components/auth/AuthPanel';
import type { UserProfile } from '@/types/profile';
import { isUserSessionExpired } from '@/lib/auth/user-session';

export const revalidate = 0;

export default async function LoginPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const activeSession = isUserSessionExpired(cookieStore) ? null : session;

  let profile: UserProfile | null = null;

  if (activeSession?.user) {
    const { data: profileRows } = await supabase
      .from('users')
      .select(
        'auth_id, full_name, email, phone, legal_name, contact_phone, profile_completed, profile_completed_at, consent_terms_at, consent_privacy_at, contact_phone_verified_at, birth_date'
      )
      .eq('auth_id', activeSession.user.id)
      .limit(1);

    const data = profileRows?.[0] as UserProfile | undefined;

    if (data) {
      profile = data;
    } else {
      profile = {
        auth_id: activeSession.user.id,
        full_name:
          (activeSession.user.user_metadata?.name ||
            activeSession.user.user_metadata?.full_name ||
            activeSession.user.email) ?? null,
        email: activeSession.user.email ?? null,
        phone: activeSession.user.phone ?? null,
        legal_name: null,
        contact_phone: null,
        profile_completed: false,
        profile_completed_at: null,
        consent_terms_at: null,
        consent_privacy_at: null,
        contact_phone_verified_at: null,
        birth_date: null
      };
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <AuthPanel sessionUser={activeSession?.user ?? null} profile={profile} />
      </div>
    </main>
  );
}
