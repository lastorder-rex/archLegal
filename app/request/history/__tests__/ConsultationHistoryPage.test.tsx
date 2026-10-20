import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConsultationHistoryPage from '../page';

const mockConsultation = {
  id: 'consult-1',
  name: '홍길동',
  phone: '010-1234-5678',
  email: 'user@example.com',
  address: '서울특별시 종로구 세종대로 209',
  address_detail: '정부서울청사 101호',
  address_code: {
    sigunguCd: '11110',
    bjdongCd: '10300',
    platGbCd: '0',
    bun: '001',
    ji: '0000',
  },
  building_info: {
    mainPurpsCdNm: '업무시설',
    totArea: 1000,
    platArea: 800,
    groundFloorCnt: 10,
    ugrndFloorCnt: 2,
    hhldCnt: null,
    fmlyNum: null,
    mainBldCnt: 1,
    atchBldCnt: 0,
    platPlc: '서울특별시 종로구',
    addressInfo: {
      sigunguCd: '11110',
      bjdongCd: '10300',
      platGbCd: '0',
      bun: '001',
      ji: '0000'
    },
    rawData: {},
  },
  main_purps: '업무시설',
  tot_area: 1000,
  plat_area: 800,
  ground_floor_cnt: 10,
  message: '기존 상담 요청 입니다.',
  attachments: [],
  created_at: new Date().toISOString(),
  is_del: 'N' as const,
  deleted_at: null,
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

jest.mock('@/components/consultation/FileUpload', () => {
  const MockFileUpload = () => <div data-testid="file-upload-placeholder" />;
  MockFileUpload.displayName = 'MockFileUpload';
  return MockFileUpload;
});

jest.mock('@/lib/utils/file-upload', () => ({
  getFileUrl: jest.fn(async () => ({ url: 'https://example.com/file' })),
  getFileIcon: jest.fn(() => '파일'),
  formatFileSize: jest.fn((size: number) => `${size}bytes`),
}));

if (typeof global.confirm !== 'function') {
  global.confirm = () => true;
}

if (typeof global.alert !== 'function') {
  global.alert = () => {};
}

describe('ConsultationHistoryPage', () => {
  const originalFetch = globalThis.fetch;
  const originalConfirm = global.confirm;
  const originalAlert = global.alert;
  const locationProto = Object.getPrototypeOf(window.location);
  const originalReload = locationProto.reload;
  const reloadMock = jest.fn();
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const createQueryWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return { Wrapper, queryClient };
  };

  beforeEach(() => {
    global.alert = jest.fn();
    reloadMock.mockReset();
    locationProto.reload = reloadMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFetch) {
      globalThis.fetch = originalFetch;
      window.fetch = originalFetch as typeof fetch;
    } else {
      // @ts-expect-error cleanup fetch polyfill
      delete globalThis.fetch;
      // @ts-expect-error cleanup window fetch
      delete window.fetch;
    }
    global.confirm = originalConfirm;
    global.alert = originalAlert;
  });

  afterAll(() => {
    locationProto.reload = originalReload;
    consoleErrorSpy.mockRestore();
  });

  it('allows users to edit an existing consultation from MyPage', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.endsWith('/api/user/me')) {
        return {
          ok: true,
          json: async () => ({ user_id: 'user-1' }),
        } as Response;
      }

      if (url.endsWith('/api/consultations') && (!init || !init.method)) {
        return {
          ok: true,
          json: async () => ({ consultations: [mockConsultation] }),
        } as Response;
      }

      if (url.includes('/api/consultations/') && init?.method === 'PATCH') {
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      }

      throw new Error(`Unhandled fetch call: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    window.fetch = fetchMock as unknown as typeof fetch;

    const { Wrapper, queryClient } = createQueryWrapper();

    render(
      <Wrapper>
        <ConsultationHistoryPage />
      </Wrapper>
    );

    await waitFor(() =>
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    );

    await screen.findByText('상담 내역 상세');
    await screen.findByText(mockConsultation.address);

    fireEvent.click(screen.getByRole('button', { name: '수정' }));

    const textarea = await screen.findByLabelText(/상담 요청사항/);
    fireEvent.change(textarea, { target: { value: '수정된 상담 요청 내용' } });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/api/consultations/${mockConsultation.id}`),
        expect.objectContaining({ method: 'PATCH' })
      )
    );

    await waitFor(() =>
      expect(screen.getByText('상담 요청이 수정되었습니다.')).toBeInTheDocument()
    );

    queryClient.clear();
  });

  it('allows users to delete a consultation after confirmation', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.endsWith('/api/user/me')) {
        return {
          ok: true,
          json: async () => ({ user_id: 'user-1' }),
        } as Response;
      }

      if (url.endsWith('/api/consultations') && (!init || !init.method)) {
        return {
          ok: true,
          json: async () => ({ consultations: [mockConsultation] }),
        } as Response;
      }

      if (url.includes('/api/consultations/') && init?.method === 'DELETE') {
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      }

      throw new Error(`Unhandled fetch call: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    window.fetch = fetchMock as unknown as typeof fetch;

    jest.spyOn(global, 'confirm').mockReturnValue(true);

    const { Wrapper, queryClient } = createQueryWrapper();

    render(
      <Wrapper>
        <ConsultationHistoryPage />
      </Wrapper>
    );

    await waitFor(() =>
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    );

    await screen.findByText('상담 내역 상세');
    await screen.findByText(mockConsultation.address);

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/api/consultations/${mockConsultation.id}`),
        expect.objectContaining({ method: 'DELETE' })
      )
    );

    await waitFor(() =>
      expect(screen.getByText('상담 요청이 삭제되었습니다.')).toBeInTheDocument()
    );

    queryClient.clear();

    expect(reloadMock).not.toHaveBeenCalled();
  });
});
