const DEV_BASE_URL = 'http://localhost:3002';

function trimTrailingSlash(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function resolveExplicitBaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return trimTrailingSlash(parsed.origin);
  } catch (error) {
    throw new Error(
      `NEXTAUTH_URL must be a valid absolute URL. Received: "${url}". ${(error as Error).message}`
    );
  }
}

export function assertNextAuthEnv() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;

  if (!nextAuthUrl) {
    throw new Error('NEXTAUTH_URL must be configured in production environments.');
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(nextAuthUrl);
  } catch (error) {
    throw new Error(
      `NEXTAUTH_URL must be a valid absolute URL. Received: "${nextAuthUrl}". ${(error as Error).message}`
    );
  }

  if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
    throw new Error('NEXTAUTH_URL cannot point to localhost in production.');
  }

  if (!nextAuthSecret) {
    throw new Error('NEXTAUTH_SECRET must be configured in production environments.');
  }
}

export function getAppBaseUrl() {
  const explicit = process.env.NEXTAUTH_URL;

  if (explicit) {
    try {
      return resolveExplicitBaseUrl(explicit);
    } catch (error) {
      console.error(error);
    }
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  if (process.env.VERCEL_URL) {
    return trimTrailingSlash(`https://${process.env.VERCEL_URL}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEV_BASE_URL;
  }

  throw new Error('Unable to resolve application base URL. Ensure NEXTAUTH_URL is configured.');
}

export function getKakaoCallbackUrl() {
  return `${getAppBaseUrl()}/api/auth/callback/kakao`;
}
