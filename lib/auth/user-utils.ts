import type { User } from '@supabase/auth-helpers-nextjs';
import type { UserProfile } from '@/types/profile';

/**
 * 사용자 닉네임 추출 유틸리티
 * 우선순위: user_metadata.name > user_metadata.full_name > email 아이디 > '사용자'
 */
export function getUserNickname(user: User | null): string {
  if (!user) return '사용자';

  return (
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    '사용자'
  );
}

/**
 * 사용자 표시 이름 추출 유틸리티
 * 우선순위: 법정이름 > 전체이름 > 닉네임
 */
export function getUserDisplayName(sessionUser: User | null, profile: UserProfile | null): string {
  if (profile?.legal_name) return profile.legal_name;
  if (profile?.full_name) return profile.full_name;
  return getUserNickname(sessionUser);
}
