import { getKakaoOAuthOptions } from '@/lib/auth/oauth';

describe('getKakaoOAuthOptions', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('builds the Kakao OAuth redirect URL without forcing consent prompt', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3002/',
    };

    const options = getKakaoOAuthOptions('/check?consultation=open');

    expect(options.redirectTo).toBe(
      'http://localhost:3002/auth/callback?next=%2Fcheck%3Fconsultation%3Dopen'
    );
    expect(options.queryParams.scope).toContain('account_email');
    expect(options.queryParams).not.toHaveProperty('prompt');
  });
});
