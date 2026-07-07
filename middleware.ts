import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

const MAP_COOKIE = 'map_access';

function notFound(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/violation')) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  return new NextResponse('Not Found', { status: 404 });
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function guardMap(request: NextRequest): Promise<NextResponse | null> {
  const accessKey = process.env.MAP_ACCESS_KEY;
  const hasAdminSession = request.cookies.has('admin_session');

  // 관리자 세션은 항상 통과
  if (hasAdminSession) {
    return null;
  }

  // 키 미설정 시: 관리자만 접근 가능(위에서 통과) → 그 외 404
  if (!accessKey) {
    return notFound(request);
  }

  // ?key=<MAP_ACCESS_KEY> 진입 → 쿠키 심고 key 제거한 URL로 redirect
  if (request.nextUrl.searchParams.get('key') === accessKey) {
    const redirectUrl = new URL(request.nextUrl);
    redirectUrl.searchParams.delete('key');
    const redirect = NextResponse.redirect(redirectUrl);
    redirect.cookies.set(MAP_COOKIE, await sha256Hex(accessKey), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return redirect;
  }

  // 유효한 map_access 쿠키 → 통과
  const cookieValue = request.cookies.get(MAP_COOKIE)?.value;
  if (cookieValue && cookieValue === (await sha256Hex(accessKey))) {
    return null;
  }

  return notFound(request);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/map' || pathname.startsWith('/api/violation')) {
    const gateResponse = await guardMap(request);
    if (gateResponse) {
      return gateResponse;
    }
  }

  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$).*)',
  ],
};
