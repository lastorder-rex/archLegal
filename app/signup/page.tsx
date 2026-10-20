import { SignupForm } from '@/components/auth/SignupForm';
import type { UserProfile } from '@/types/profile';
import { USER_PROFILE_COLUMNS } from '@/lib/auth/user-profile';
import { requireUserSession } from '@/lib/auth/require-session';
import { sanitizeRedirectPath } from '@/lib/utils/navigation';
import {
  extractKakaoProfile,
  getKakaoString,
  KakaoMetadata,
  normalizeKakaoPhone,
  parseKakaoIdentityData
} from '@/lib/auth/kakao-profile';

export const revalidate = 0;

type SignupPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { supabase, session } = await requireUserSession('/signup');

  const nextParam = Array.isArray(searchParams?.next)
    ? searchParams?.next?.[0]
    : searchParams?.next;
  const nextPath = sanitizeRedirectPath(nextParam);

  const { data: profileRow } = await supabase
    .from('users')
    .select(USER_PROFILE_COLUMNS)
    .eq('auth_id', session.user.id)
    .maybeSingle();

  const metadata = (session.user.user_metadata ?? null) as KakaoMetadata | null;
  const rawIdentityData = session.user.identities?.find(identity => identity.provider === 'kakao')
    ?.identity_data;
  const identityData = parseKakaoIdentityData(rawIdentityData);
  const { legalName: kakaoLegalName, phone: kakaoPhone, birthDate: kakaoBirthDate } = extractKakaoProfile(
    metadata,
    identityData
  );

  const fallbackEmail = profileRow?.email ?? session.user.email ?? null;
  const fallbackFullName =
    profileRow?.full_name ??
    kakaoLegalName ??
    getKakaoString(metadata?.['name']) ??
    getKakaoString(metadata?.['full_name']) ??
    (fallbackEmail ? fallbackEmail.split('@')[0] : null);
  const sessionPhone = normalizeKakaoPhone(getKakaoString(session.user.phone));
  const fallbackPhone = profileRow?.phone ?? kakaoPhone ?? sessionPhone ?? null;
  const fallbackLegalName = profileRow?.legal_name ?? kakaoLegalName ?? null;
  const fallbackContactPhone = profileRow?.contact_phone ?? kakaoPhone ?? fallbackPhone ?? null;
  const fallbackBirthDate = profileRow?.birth_date ?? kakaoBirthDate ?? null;

  const profile: UserProfile = {
    auth_id: session.user.id,
    full_name: fallbackFullName,
    email: fallbackEmail,
    phone: fallbackPhone,
    legal_name: fallbackLegalName,
    contact_phone: fallbackContactPhone,
    profile_completed: profileRow?.profile_completed ?? false,
    profile_completed_at: profileRow?.profile_completed_at ?? null,
    consent_terms_at: profileRow?.consent_terms_at ?? null,
    consent_privacy_at: profileRow?.consent_privacy_at ?? null,
    contact_phone_verified_at: profileRow?.contact_phone_verified_at ?? null,
    birth_date: fallbackBirthDate
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
        <SignupForm profile={profile} nextPath={nextPath} fallbackEmail={fallbackEmail} />
      </div>
    </main>
  );
}
