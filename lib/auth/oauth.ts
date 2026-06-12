const KAKAO_SCOPES = [
  'account_email',
  'phone_number',
  'name',
  'birthday',
  'birthyear'
];

export function getAuthRedirectOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const origin = configuredOrigin || fallbackOrigin;

  return origin.endsWith('/') ? origin.slice(0, -1) : origin;
}

export function getKakaoOAuthOptions(nextPath: string) {
  return {
    redirectTo: `${getAuthRedirectOrigin()}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    queryParams: {
      scope: KAKAO_SCOPES.join(' ')
    }
  };
}

