import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/profile';

/**
 * users 테이블에서 프로필 조회 시 공통으로 select 하는 컬럼 목록.
 * login/signup/request/mypage 등 여러 서버 컴포넌트에서 공유한다.
 */
export const USER_PROFILE_COLUMNS =
  'auth_id, full_name, email, phone, legal_name, contact_phone, profile_completed, profile_completed_at, consent_terms_at, consent_privacy_at, contact_phone_verified_at, birth_date';

/**
 * users 테이블에 프로필 행이 없을 때 세션 정보로 구성하는 기본 프로필.
 */
export function buildFallbackProfile(sessionUser: User): UserProfile {
  return {
    auth_id: sessionUser.id,
    full_name:
      (sessionUser.user_metadata?.name ||
        sessionUser.user_metadata?.full_name ||
        sessionUser.email) ?? null,
    email: sessionUser.email ?? null,
    phone: sessionUser.phone ?? null,
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
