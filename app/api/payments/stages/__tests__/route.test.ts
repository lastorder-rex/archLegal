jest.mock('next/server', () => {
  class MockNextResponse extends Response {
    static json(body: any, init: ResponseInit = {}) {
      const headers = new Headers(init.headers || {});
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return new MockNextResponse(JSON.stringify(body), {
        status: init.status ?? 200,
        headers
      });
    }
  }

  return { NextResponse: MockNextResponse };
});

import { GET } from '../route';

jest.mock('next/headers', () => ({
  cookies: jest.fn()
}));

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn()
}));

jest.mock('@/lib/auth/user-session', () => ({
  isUserSessionExpired: jest.fn(),
  createExpiredSessionResponse: jest.fn()
}));

const cookiesMock = jest.requireMock('next/headers').cookies as jest.Mock;
const { createRouteHandlerClient } = jest.requireMock('@supabase/auth-helpers-nextjs') as {
  createRouteHandlerClient: jest.Mock;
};
const { isUserSessionExpired, createExpiredSessionResponse } = jest.requireMock(
  '@/lib/auth/user-session'
) as {
  isUserSessionExpired: jest.Mock;
  createExpiredSessionResponse: jest.Mock;
};
const { NextResponse } = jest.requireMock('next/server') as { NextResponse: typeof Response };

describe('GET /api/payments/stages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cookiesMock.mockReturnValue({
      get: () => ({ value: 'session-cookie' })
    });
    isUserSessionExpired.mockReturnValue(false);
  });

  it('returns stage data when authenticated', async () => {
    const maybeSingleMock = jest.fn().mockResolvedValue({
      data: { created_at: '2024-10-14T10:00:00Z' }
    });

    createRouteHandlerClient.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-1' } } },
          error: null
        })
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: maybeSingleMock
      })
    });

    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(Array.isArray(json.stages)).toBe(true);
    expect(json.stages[0]).toMatchObject({
      id: 'stage-site-survey',
      status: 'awaiting'
    });
    expect(maybeSingleMock).toHaveBeenCalled();
  });

  it('returns expired session response when cookie expired', async () => {
    const expiredResponse = NextResponse.json({ error: 'expired' }, { status: 401 });
    isUserSessionExpired.mockReturnValue(true);
    createExpiredSessionResponse.mockReturnValue(expiredResponse);

    const response = await GET();
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: 'expired' });
  });

  it('returns 401 when session is missing', async () => {
    createRouteHandlerClient.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null })
      },
      from: jest.fn()
    });

    const response = await GET();
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('로그인이 필요합니다.');
  });
});
