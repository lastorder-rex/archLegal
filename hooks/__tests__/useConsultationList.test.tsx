import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConsultationList } from '../useConsultationList';
import { consultationRecordSchema } from '@/lib/validations/consultation';

const SAMPLE_RECORD = consultationRecordSchema.parse({
  id: 'consult-1',
  name: '홍길동',
  phone: '010-1234-5678',
  email: 'hong@example.com',
  address: '서울시 예시구 예시로 123',
  address_detail: null,
  address_code: {
    sigunguCd: '11110',
    bjdongCd: '1111051500',
    platGbCd: '0',
    bun: '1234',
    ji: '56',
    sigunguName: '예시구',
    bjdongName: '예시동'
  },
  building_info: null,
  main_purps: '주택',
  tot_area: 120,
  plat_area: 80,
  ground_floor_cnt: 2,
  message: '테스트 상담',
  attachments: [],
  created_at: '2024-10-14T10:00:00Z',
  is_del: 'N',
  deleted_at: null
});

type ConsultationRecord = typeof SAMPLE_RECORD;

const originalFetch = globalThis.fetch;
const originalWindowFetch = typeof window !== 'undefined' ? window.fetch : undefined;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
}

describe('useConsultationList', () => {
  afterEach(() => {
    jest.clearAllMocks();
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      // @ts-expect-error cleanup fetch
      delete globalThis.fetch;
    }
    if (typeof window !== 'undefined') {
      if (originalWindowFetch) {
        window.fetch = originalWindowFetch;
      } else {
        // @ts-expect-error cleanup window fetch
        delete window.fetch;
      }
    }
  });

  it('fetches consultations and refreshes data', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ consultations: [SAMPLE_RECORD] })
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ consultations: [] })
      } as any);

    (globalThis as any).fetch = fetchMock;
    if (typeof window !== 'undefined') {
      (window as any).fetch = fetchMock;
    }

    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () =>
        useConsultationList<ConsultationRecord>({
          schema: consultationRecordSchema.array()
        }),
      { wrapper }
    );

    let refreshed: ConsultationRecord[] | null = null;
    await act(async () => {
      refreshed = await result.current.refresh();
    });

    expect(refreshed).not.toBeNull();
    expect(refreshed).toHaveLength(1);
    expect(refreshed![0].id).toBe(SAMPLE_RECORD.id);

    let refreshedSecond: ConsultationRecord[] | null = null;
    await act(async () => {
      refreshedSecond = await result.current.refresh();
    });

    expect(refreshedSecond).not.toBeNull();
    expect(refreshedSecond).toHaveLength(0);

    queryClient.clear();
  });

  it('handles 401 unauthorized responses', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({})
      } as any);

    (globalThis as any).fetch = fetchMock;
    if (typeof window !== 'undefined') {
      (window as any).fetch = fetchMock;
    }

    const onUnauthorized = jest.fn();
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useConsultationList<ConsultationRecord>({ onUnauthorized }),
      { wrapper }
    );

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(onUnauthorized).toHaveBeenCalled();
      expect(result.current.error).toBe('로그인이 필요합니다.');
    });

    queryClient.clear();
  });

  it('surfaces fetch errors', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: '서버 오류' })
      } as any);

    (globalThis as any).fetch = fetchMock;
    if (typeof window !== 'undefined') {
      (window as any).fetch = fetchMock;
    }

    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useConsultationList<ConsultationRecord>(),
      { wrapper }
    );

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('서버 오류');
    });

    queryClient.clear();
  });
});
