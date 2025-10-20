import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  combineBirthDate,
  extractKakaoProfile,
  fetchKakaoUserProfile,
  getKakaoString,
  KakaoMetadata,
  normalizeKakaoPhone,
  parseKakaoIdentityData
} from '@/lib/auth/kakao-profile';
import { setUserSessionCookie } from '@/lib/auth/user-session';
import { createSupabaseAdminClient } from '../../../supabase/admin';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('next') ?? '/';

  // Open Redirect 방지: //로 시작하는 경로 차단 및 동일 origin 검증
  let safeRedirectPath = '/';
  if (redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    try {
      // URL 파싱하여 동일 origin인지 검증
      const redirectUrl = new URL(redirectTo, requestUrl.origin);
      if (redirectUrl.origin === requestUrl.origin) {
        safeRedirectPath = redirectUrl.pathname + redirectUrl.search + redirectUrl.hash;
      }
    } catch {
      // URL 파싱 실패 시 기본 경로 사용
      safeRedirectPath = '/';
    }
  }

  if (!code) {
    return NextResponse.redirect(new URL(safeRedirectPath, requestUrl.origin));
  }

  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.exchangeCodeForSession(code);

  const { data: sessionData } = await supabase.auth.getSession();
  const providerAccessToken = sessionData.session?.provider_token ?? null;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const metadata = (user.user_metadata ?? null) as KakaoMetadata | null;
    try {
      const admin = createSupabaseAdminClient();
      const rawIdentityData = user.identities?.find(
        identity => identity.provider === 'kakao'
      )?.identity_data;
      const identityData = parseKakaoIdentityData(rawIdentityData);
      const kakaoApiProfile = providerAccessToken
        ? await fetchKakaoUserProfile(providerAccessToken)
        : null;
      if (process.env.NODE_ENV !== 'production') {
        console.log('Kakao API profile response:', JSON.stringify(kakaoApiProfile, null, 2));
      }
      const { legalName, phone: kakaoPhone, birthDate } = extractKakaoProfile(
        metadata,
        identityData,
        kakaoApiProfile ?? undefined,
        kakaoApiProfile?.kakao_account
      );
      const rawBirthyear = getKakaoString(kakaoApiProfile?.kakao_account?.birthyear);
      const rawBirthday = getKakaoString(kakaoApiProfile?.kakao_account?.birthday);
      const kakaoBirthDate = birthDate ?? combineBirthDate(rawBirthyear, rawBirthday);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Extracted Kakao profile:', {
          legalName,
          kakaoPhone,
          birthDate: kakaoBirthDate,
          rawBirthyear,
          rawBirthday
        });
      }
      const fullName =
        getKakaoString(user.user_metadata?.name) ??
        getKakaoString(user.user_metadata?.full_name) ??
        legalName ??
        getKakaoString(user.email) ??
        null;
      const normalizedPhone = kakaoPhone ?? normalizeKakaoPhone(getKakaoString(user.phone)) ?? null;

      const upsertPayload: Record<string, unknown> = {
        auth_id: user.id,
        email: user.email,
        full_name: fullName,
        phone: normalizedPhone
      };
      if (legalName) {
        upsertPayload.legal_name = legalName;
      }
      if (kakaoBirthDate) {
        upsertPayload.birth_date = kakaoBirthDate;
      }

      await admin.from('users').upsert(upsertPayload, { onConflict: 'auth_id' });

      const profileResult = await admin
        .from('users')
        .select(
          'auth_id, profile_completed, contact_phone, legal_name, profile_completed_at, consent_terms_at, consent_privacy_at, birth_date'
        )
        .eq('auth_id', user.id)
        .single();
      if (profileResult.error) {
        console.error('Failed to load profile for updates', profileResult.error);
      }
      let profileData = profileResult.data;

      if (profileData) {
        const updates: Record<string, unknown> = {};

        if (!profileData.contact_phone && (kakaoPhone ?? normalizedPhone)) {
          updates.contact_phone = kakaoPhone ?? normalizedPhone;
        }

        if (!profileData.legal_name && legalName) {
          updates.legal_name = legalName;
        }

        if (!profileData.birth_date && kakaoBirthDate) {
          updates.birth_date = kakaoBirthDate;
        }

        if (Object.keys(updates).length > 0) {
          await admin.from('users').update(updates).eq('auth_id', user.id);
          profileData = { ...profileData, ...updates };
        }
      }

      const profileCompleted = profileData?.profile_completed ?? false;

      if (!profileCompleted) {
        const signupUrl = new URL('/signup', requestUrl.origin);
        if (safeRedirectPath && safeRedirectPath !== '/signup') {
          signupUrl.searchParams.set('next', safeRedirectPath);
        }
        const signupRedirect = NextResponse.redirect(signupUrl);
        setUserSessionCookie(signupRedirect);
        return signupRedirect;
      }
    } catch (error) {
      console.error('Failed to sync user profile', error);
    }
  }

  const finalRedirect = NextResponse.redirect(new URL(safeRedirectPath, requestUrl.origin));
  if (user) {
    setUserSessionCookie(finalRedirect);
  }
  return finalRedirect;
}
