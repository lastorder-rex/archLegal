import { z } from 'zod';

// Korean phone number regex
const koreanPhoneRegex = /^010-[0-9]{4}-[0-9]{4}$/;

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
  name: z
    .string()
    .min(2, '이름은 2글자 이상 입력해주세요')
    .max(50, '이름은 50글자 이하로 입력해주세요')
    .trim(),

  phone: z
    .string()
    .regex(koreanPhoneRegex, '올바른 휴대폰 번호를 입력해주세요 (예: 010-1234-5678)'),

  email: z
    .string()
    .email('올바른 이메일 형식을 입력해주세요')
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, '영문, 숫자, 특수문자만 사용 가능합니다')
    .optional()
    .or(z.literal('')),

  // Address information
  address: z
    .string()
    .min(5, '주소를 선택해주세요')
    .max(200, '주소가 너무 깁니다'),

  addressCode: addressCodeSchema,

  // Building information
  buildingInfo: buildingInfoSchema,

  // Consultation message
  message: z
    .string()
    .max(1000, '상담 내용은 1000글자 이하로 입력해주세요')
    .optional()
    .or(z.literal('')),
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

// Utility function to format phone number
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Format as 010-XXXX-XXXX if it's 11 digits and starts with 010
  if (digits.length === 11 && digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  return phone; // Return original if format doesn't match
}

// Utility function to validate and format phone number input
export function validatePhoneInput(phone: string): { formatted: string; valid: boolean } {
  const formatted = formatPhoneNumber(phone);
  const valid = koreanPhoneRegex.test(formatted);
  return { formatted, valid };
}