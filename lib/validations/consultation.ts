import { z } from 'zod';
import {
  nameSchema,
  optionalEmailSchema,
  phoneSchema,
  formatPhoneNumber,
  validatePhoneInput,
} from './user';

// Address code schema (from Juso API)
export const addressCodeSchema = z.object({
  sigunguCd: z.string().min(1, '시군구 코드가 필요합니다'),
  bjdongCd: z.string().min(1, '법정동 코드가 필요합니다'),
  platGbCd: z.string().min(1, '대지구분 코드가 필요합니다'),
  bun: z.string().min(1, '번지가 필요합니다'),
  ji: z.string().min(1, '지번이 필요합니다'),
});

// Building info schema (from Building Registry API)
export const buildingInfoSchema = z.object({
  mainPurpsCdNm: z.string().min(1, '건물 주용도가 필요합니다'),
  totArea: z.number().nullable().optional(),
  platArea: z.number().nullable().optional(),
  groundFloorCnt: z.number().nullable().optional(),
  ugrndFloorCnt: z.number().nullable().optional(),
  hhldCnt: z.number().nullable().optional(),
  fmlyNum: z.number().nullable().optional(),
  mainBldCnt: z.number().nullable().optional(),
  atchBldCnt: z.number().nullable().optional(),
  platPlc: z.string().nullable().optional(),
  addressInfo: z.object({
    sigunguCd: z.string(),
    bjdongCd: z.string(),
    platGbCd: z.string(),
    bun: z.string(),
    ji: z.string(),
  }).optional(),
  rawData: z.any(), // Store full API response
});

// Main consultation form validation schema
export const consultationFormSchema = z.object({
  // User information
  name: nameSchema,

  phone: phoneSchema,

  email: optionalEmailSchema,

  // Address information
  address: z
    .string()
    .min(5, '주소를 선택해주세요')
    .max(200, '주소가 너무 깁니다'),

  addressDetail: z
    .string()
    .max(100, '상세 주소는 100글자 이하로 입력해주세요')
    .optional()
    .or(z.literal('')),

  addressCode: addressCodeSchema,

  // Building information
  buildingInfo: buildingInfoSchema,

  // Consultation message
  message: z
    .string()
    .min(1, '상담 요청사항을 입력해주세요')
    .max(1000, '상담 내용은 1000글자 이하로 입력해주세요'),
});

// Types derived from schemas
export type AddressCode = z.infer<typeof addressCodeSchema>;
export type BuildingInfo = z.infer<typeof buildingInfoSchema>;
export type ConsultationForm = z.infer<typeof consultationFormSchema>;

// Address search result type (for Juso API response)
export const addressSearchResultSchema = z.object({
  id: z.string(),
  roadAddr: z.string(),
  jibunAddr: z.string(),
  zipNo: z.string(),
  buildingName: z.string().nullable(),
  detailBuildingName: z.string().nullable(),
  addressCode: addressCodeSchema,
});

export type AddressSearchResult = z.infer<typeof addressSearchResultSchema>;

// Building search result type (for Building Registry API response)
export const buildingSearchResultSchema = z.object({
  building: buildingInfoSchema,
  summary: z.object({
    mainPurpose: z.string(),
    totalArea: z.number().nullable(),
    plotArea: z.number().nullable(),
    floors: z.object({
      ground: z.number().nullable(),
      underground: z.number().nullable(),
    }),
    households: z.number().nullable(),
  }),
});

export type BuildingSearchResult = z.infer<typeof buildingSearchResultSchema>;

/**
 * 상세주소 입력 필터링 - SQL injection 및 XSS 방지
 */
export function filterAddressDetailInput(value: string) {
  // 한글, 영문, 숫자, 공백, 하이픈, 쉼표, 괄호만 허용
  return value.replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9\s\-,()]/g, '');
}

/**
 * 상담 메시지 입력 필터링 - SQL injection 및 XSS 방지
 */
export function filterMessageInput(value: string) {
  // 한글, 영문, 숫자, 공백, 기본 문장부호만 허용 (HTML 태그, SQL 특수문자 제거)
  return value.replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9\s.,!?()~\-]/g, '');
}

export { formatPhoneNumber, validatePhoneInput };
