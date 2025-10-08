import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConsultationForm from '../ConsultationForm';
import type { User } from '@supabase/auth-helpers-nextjs';
import type { UserProfile } from '@/types/profile';

const mockAddress = {
  id: 'addr-1',
  roadAddr: '서울특별시 종로구 새문안로 82',
  jibunAddr: '서울특별시 종로구 신문로1가 163',
  zipNo: '03172',
  buildingName: '정부서울청사',
  detailBuildingName: null,
  addressCode: {
    sigunguCd: '11110',
    bjdongCd: '10300',
    platGbCd: '0',
    bun: '001',
    ji: '0000',
  },
};

const mockBuildingResponse = {
  building: {
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
      ji: '0000',
    },
    rawData: {},
  },
  summary: {
    mainPurpose: '업무시설',
    totalArea: 1000,
    plotArea: 800,
    floors: {
      ground: 10,
      underground: 2,
    },
    households: null,
  },
};

const baseUser = {
  id: 'user-1',
  email: 'user@example.com',
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: '',
  factors: [],
  identities: [],
  phone: '',
  role: '',
  updated_at: '',
} as unknown as User;

const baseProfile: UserProfile = {
  auth_id: 'user-1',
  full_name: '홍길동',
  legal_name: null,
  email: 'user@example.com',
  phone: '010-1111-2222',
  contact_phone: '010-1234-5678',
  profile_completed: true,
  profile_completed_at: new Date().toISOString(),
  consent_terms_at: new Date().toISOString(),
  consent_privacy_at: new Date().toISOString(),
  contact_phone_verified_at: new Date().toISOString(),
  birth_date: '1990-01-01',
};

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(() => ({})),
}));

jest.mock('@/components/consultation/sections/UserInfoSection', () => ({
  UserInfoSection: ({ formData, errors, onInputChange }: any) => (
    <div>
      <input
        id="name"
        data-testid="name-input"
        value={formData.name ?? ''}
        onChange={e => onInputChange('name', e.target.value)}
      />
      {errors.name && <span data-testid="name-error">{errors.name}</span>}
      <input
        id="phone"
        data-testid="phone-input"
        value={formData.phone ?? ''}
        onChange={e => onInputChange('phone', e.target.value)}
      />
    </div>
  ),
}));

jest.mock('@/components/consultation/sections/AddressSection', () => ({
  AddressSection: ({ formData, errors }: any) => (
    <div>
      <input data-testid="address-input" value={formData.address ?? ''} readOnly />
      {errors.address && <span data-testid="address-error">{errors.address}</span>}
    </div>
  ),
}));

jest.mock('@/components/consultation/sections/BuildingInfoSection', () => ({
  BuildingInfoSection: () => <div data-testid="building-info-placeholder" />,
}));

jest.mock('@/components/consultation/sections/MessageSection', () => ({
  MessageSection: ({ formData, errors, onInputChange }: any) => (
    <div>
      <textarea
        id="message"
        data-testid="message-input"
        value={formData.message ?? ''}
        onChange={e => onInputChange('message', e.target.value)}
      />
      {errors.message && <span data-testid="message-error">{errors.message}</span>}
    </div>
  ),
}));

jest.mock('@/components/consultation/sections/AttachmentsSection', () => ({
  AttachmentsSection: () => <div data-testid="attachments-placeholder" />,
}));

jest.mock('@/components/consultation/sections/SubmitSection', () => ({
  SubmitSection: ({ errors, isSubmitting }: any) => (
    <div>
      {errors.submit && <div data-testid="submit-error">{errors.submit}</div>}
      <button type="submit" disabled={isSubmitting}>
        제출
      </button>
    </div>
  ),
}));

jest.mock('@/components/consultation/AddressSearchModal', () => ({
  AddressSearchModal: ({ onSelect }: any) => (
    <button
      type="button"
      data-testid="select-address"
      onClick={() => onSelect(mockAddress)}
    >
      주소 선택
    </button>
  ),
}));

describe('ConsultationForm', () => {
  const originalFetch = globalThis.fetch;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    jest.restoreAllMocks();
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      // @ts-expect-error cleanup fetch polyfill
      delete globalThis.fetch;
    }
  });

  it('submits a consultation successfully and shows success state', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.endsWith('/api/building/title')) {
        return {
          ok: true,
          json: async () => mockBuildingResponse,
        } as Response;
      }

      if (url.endsWith('/api/consultations') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ id: 'consult-1' }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    });

    // @ts-expect-error assign mock fetch for test
    globalThis.fetch = fetchMock;

    render(<ConsultationForm user={baseUser} profile={baseProfile} />);

    fireEvent.click(screen.getByTestId('select-address'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/building/title',
        expect.objectContaining({ method: 'POST' })
      )
    );

    await waitFor(() =>
      expect(screen.getByTestId('address-input')).toHaveValue(mockAddress.roadAddr)
    );

    fireEvent.change(screen.getByTestId('message-input'), {
      target: { value: '상담을 신청합니다.' },
    });

    fireEvent.click(screen.getByRole('button', { name: '제출' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/consultations',
        expect.objectContaining({ method: 'POST' })
      )
    );

    await waitFor(() =>
      expect(screen.getByText('상담 요청이 저장되었습니다')).toBeInTheDocument()
    );
  });

  it('surfaces an error message when the consultation submission fails', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.endsWith('/api/building/title')) {
        return {
          ok: true,
          json: async () => mockBuildingResponse,
        } as Response;
      }

      if (url.endsWith('/api/consultations') && init?.method === 'POST') {
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: '서버 오류' }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    });

    // @ts-expect-error assign mock fetch for test
    globalThis.fetch = fetchMock;

    render(<ConsultationForm user={baseUser} profile={baseProfile} />);

    fireEvent.click(screen.getByTestId('select-address'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/building/title',
        expect.objectContaining({ method: 'POST' })
      )
    );

    fireEvent.change(screen.getByTestId('message-input'), {
      target: { value: '상담 요청 실패 케이스' },
    });

    fireEvent.click(screen.getByRole('button', { name: '제출' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/consultations',
        expect.objectContaining({ method: 'POST' })
      )
    );

    await waitFor(() =>
      expect(screen.getByTestId('submit-error')).toHaveTextContent('서버 오류')
    );
  });
});
