import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { USER_SESSION_COOKIE, USER_SESSION_DURATION_MS } from '@/lib/constants/session';

export { USER_SESSION_COOKIE, USER_SESSION_DURATION_MS };

type CookieStore = ReturnType<typeof cookies>;

function parseExpiresAt(rawValue: string | undefined) {
  if (!rawValue) return null;
  const expiresAt = Number.parseInt(rawValue, 10);
  return Number.isFinite(expiresAt) ? expiresAt : null;
}

export function getUserSessionExpiresAt(cookieStore: CookieStore) {
  const cookie = cookieStore.get(USER_SESSION_COOKIE);
  return parseExpiresAt(cookie?.value);
}

export function isUserSessionExpired(cookieStore: CookieStore) {
  const expiresAt = getUserSessionExpiresAt(cookieStore);
  if (!expiresAt) return true;
  return Date.now() >= expiresAt;
}

export function createExpiredSessionResponse(message = '세션이 만료되었습니다. 다시 로그인해주세요.') {
  const response = NextResponse.json({ error: message }, { status: 401 });
  response.cookies.delete(USER_SESSION_COOKIE, { path: '/' });
  return response;
}

export function setUserSessionCookie(response: NextResponse, issuedAt = Date.now()) {
  const expiresAt = issuedAt + USER_SESSION_DURATION_MS;
  response.cookies.set(USER_SESSION_COOKIE, expiresAt.toString(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: Math.floor(USER_SESSION_DURATION_MS / 1000),
    path: '/'
  });
}

export function clearUserSessionCookie(response: NextResponse) {
  response.cookies.delete(USER_SESSION_COOKIE, { path: '/' });
}
