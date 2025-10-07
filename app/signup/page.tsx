import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignupForm } from '@/components/auth/SignupForm';
import type { UserProfile } from '@/types/profile';
import { isUserSessionExpired } from '@/lib/auth/user-session';

export const revalidate = 0;

type SignupPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function sanitizeNextParam(value: string | undefined): string {
  if (!value) return '/';
  try {
    const decoded = decodeURIComponent(value);
    return decoded.startsWith('/') ? decoded : '/';
  } catch (error) {
    return '/';
  }
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const cookieStore = cookies();

  if (isUserSessionExpired(cookieStore)) {
    redirect('/login?redirect=/signup');
  }

  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login?redirect=/signup');
  }

  const nextParam = Array.isArray(searchParams?.next)
    ? searchParams?.next?.[0]
    : searchParams?.next;
  const nextPath = sanitizeNextParam(nextParam);

  const { data: profileRow } = await supabase
    .from('users')
    .select(
      'auth_id, full_name, email, phone, legal_name, contact_phone, profile_completed, profile_completed_at, consent_terms_at, consent_privacy_at, contact_phone_verified_at, birth_date'
    )
    .eq('auth_id', session.user.id)
    .maybeSingle();

  const profile: UserProfile = {
    auth_id: session.user.id,
    full_name: profileRow?.full_name ?? null,
    email: profileRow?.email ?? session.user.email ?? null,
    phone: profileRow?.phone ?? session.user.phone ?? null,
    legal_name: profileRow?.legal_name ?? null,
    contact_phone: profileRow?.contact_phone ?? null,
    profile_completed: profileRow?.profile_completed ?? false,
    profile_completed_at: profileRow?.profile_completed_at ?? null,
    consent_terms_at: profileRow?.consent_terms_at ?? null,
    consent_privacy_at: profileRow?.consent_privacy_at ?? null,
    contact_phone_verified_at: profileRow?.contact_phone_verified_at ?? null,
    birth_date: profileRow?.birth_date ?? null
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-2xl space-y-8 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-foreground">회원정보 {profile.profile_completed ? '수정' : '등록'}</h1>
          <p className="text-sm text-muted-foreground">
            상담 신청 전에 실명과 연락처를 확인하고 필수 동의 항목을 완료해주세요.
          </p>
        </header>
        <SignupForm profile={profile} nextPath={nextPath} fallbackEmail={session.user.email ?? null} />
      </div>
    </main>
  );
}
