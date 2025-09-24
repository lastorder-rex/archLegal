export function assertNextAuthEnv() {
  // FIX: Guard against misconfigured production auth domains.
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
