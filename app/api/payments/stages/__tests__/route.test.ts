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

  function createQueryBuilder(result: unknown, resolveMethod: 'order' | 'in') {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn(function (this: unknown) {
        return resolveMethod === 'order' ? Promise.resolve(result) : this;
      }),
      in: jest.fn(function (this: unknown) {
        return resolveMethod === 'in' ? Promise.resolve(result) : this;
      })
    };
  }

  it('returns consultation stage data when authenticated', async () => {
    const consultationsQuery = createQueryBuilder({
      data: [
        {
          id: 'consultation-1',
          nickname: '홍길동',
          name: '홍길동',
          address: '서울특별시 종로구 새문안로 82',
          address_detail: null,
          created_at: '2024-10-14T10:00:00Z'
        }
      ],
      error: null
    }, 'order');
    const stageIdsQuery = createQueryBuilder({
      data: [{ consultation_id: 'consultation-1' }],
      error: null
    }, 'in');
    const templatesQuery = createQueryBuilder({
      data: [
        {
          id: 'stage-site-survey',
          stage_order: 1,
          code: 'site_survey',
          title: '현장조사',
          description: '현장조사 단계',
          default_amount: 100000,
          updated_at: '2024-10-14T10:00:00Z'
        }
      ],
      error: null
    }, 'order');
    const stagesQuery = createQueryBuilder({
      data: [
        {
          consultation_id: 'consultation-1',
          stage_template_id: 'stage-site-survey',
          status: 'awaiting',
          request_amount: 100000,
          requested_at: '2024-10-14T10:00:00Z',
          paid_at: null,
          paid_amount: null,
          payment_key: null,
          canceled_at: null,
          updated_at: '2024-10-14T10:00:00Z'
        }
      ],
      error: null
    }, 'in');
    const fromMock = jest
      .fn()
      .mockReturnValueOnce(consultationsQuery)
      .mockReturnValueOnce(stageIdsQuery)
      .mockReturnValueOnce(templatesQuery)
      .mockReturnValueOnce(stagesQuery);
    createRouteHandlerClient.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-1' } } },
          error: null
        })
      },
      from: fromMock
    });

    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(Array.isArray(json.consultationsWithStages)).toBe(true);
    expect(json.consultationsWithStages[0].consultation).toMatchObject({
      id: 'consultation-1',
      address: '서울특별시 종로구 새문안로 82'
    });
    expect(json.consultationsWithStages[0].stages[0]).toMatchObject({
      id: 'stage-site-survey',
      status: 'awaiting'
    });
    expect(fromMock).toHaveBeenCalledTimes(4);
  });

  it('returns 401 when Supabase session has an error', async () => {
    createRouteHandlerClient.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: null },
          error: new Error('expired')
        })
      },
      from: jest.fn()
    });

    const response = await GET();
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('세션이 만료되었습니다. 다시 로그인해주세요.');
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
    expect(json.error).toBe('세션이 만료되었습니다. 다시 로그인해주세요.');
  });
});
