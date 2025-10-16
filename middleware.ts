import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BASIC_AUTH_PASSWORD = 'Opus!Rex!'

export function middleware(request: NextRequest) {
  const authorizationHeader = request.headers.get('authorization');

  if (authorizationHeader) {
    const [scheme, encoded] = authorizationHeader.split(' ');

    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);
      const separatorIndex = decoded.indexOf(':');

      if (separatorIndex !== -1) {
        const password = decoded.slice(separatorIndex + 1);

        if (password === BASIC_AUTH_PASSWORD) {
          return NextResponse.next();
        }
      }
    }
  }

  const response = new NextResponse('Authentication required.', {
    status: 401
  });

  response.headers.set('WWW-Authenticate', 'Basic realm="Protected"');

  return response;
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|robots.txt|sitemap.xml|docu/).*)']
};
