// 관리자(supercore) 페이지 공용 타입 모음.
// 여러 페이지에 중복 정의돼 있던 인라인 타입을 1:1 그대로 이동/공유한다.

/** 로그인 세션 관리자 (8개 supercore 페이지 공용). */
export interface Admin {
  id: string;
  username: string;
}

/** 관리자 계정 목록/편집용 확장형 (app/supercore/admins/page.tsx 전용). */
export interface AdminAccount {
  id: string;
  username: string;
  created_at: string;
  two_factor_enabled: boolean;
}

/** 상담 목록 항목 (consultations/page.tsx, users/[userId]/consultations/page.tsx 공용). */
export interface Consultation {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  address_detail: string | null;
  main_purps: string;
  message: string | null;
  created_at: string;
  attachments: any[];
}

/** 결제 목록 행 (payments/page.tsx 전용). */
export interface PaymentRow {
  id: string;
  userId: string;
  consultationId: string | null;
  stageTemplateId: string;
  status: string;
  requestAmount: number | null;
  requestedAt: string | null;
  requestedBy: string | null;
  paidAmount: number | null;
  paidAt: string | null;
  paymentKey: string | null;
  updatedAt: string | null;
  consultation: {
    id: string;
    name: string | null;
    phone: string | null;
    address: string | null;
    address_detail: string | null;
  } | null;
  driveFolder: {
    driveFolderId: string | null;
    driveFolderName: string | null;
    status: string | null;
  } | null;
}

/** 사용자 목록 항목 (users/page.tsx 전용). */
export interface User {
  id: string;
  legal_name: string;
  email: string;
  phone: string;
  birth_date: string | null;
  created_at: string;
  last_sign_in_at: string;
  consultation_count: number;
  payment_count: number;
}

/** 사용자 상세 (users/[userId]/page.tsx 전용). */
export interface UserDetail {
  id: string;
  legal_name: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  profile_completed: boolean;
  profile_completed_at: string | null;
  consent_terms_at: string | null;
  consent_privacy_at: string | null;
  created_at: string;
  updated_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
}
