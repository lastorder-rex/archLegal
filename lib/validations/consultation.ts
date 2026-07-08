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
  sigunguName: z.string().optional(),
  bjdongName: z.string().optional(),
});

// Building info schema (from Building Registry API)
export const buildingInfoSchema = z.object({
  mainPurpsCdNm: z.string().min(1, '건물 주용도가 필요합니다'),
  secondaryUse: z.string().nullable().optional(),
  totArea: z.number().nullable().optional(),
  platArea: z.number().nullable().optional(),
  groundFloorCnt: z.number().nullable().optional(),
  ugrndFloorCnt: z.number().nullable().optional(),
  hhldCnt: z.number().nullable().optional(),
  fmlyNum: z.number().nullable().optional(),
  mainBldCnt: z.number().nullable().optional(),
  atchBldCnt: z.number().nullable().optional(),
  platPlc: z.string().nullable().optional(),
  source: z.enum(['national_api', 'local_db', 'stored']).optional(),
  addressInfo: z.object({
    sigunguCd: z.string(),
    bjdongCd: z.string(),
    platGbCd: z.string(),
    bun: z.string(),
    ji: z.string(),
  }).optional(),
  rawData: z.any(), // Store full API response
});

export const storedBuildingInfoSchema = buildingInfoSchema
  .extend({
    queryTimestamp: z.string().optional(),
    rawData: z.any().optional()
  })
  .passthrough();

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
  dongName: z.string().nullable().optional(),
  hoName: z.string().nullable().optional(),
  addressCode: addressCodeSchema,
});

export type AddressSearchResult = z.infer<typeof addressSearchResultSchema>;

// Building search result type (for Building Registry API response)
export const buildingSearchResultSchema = z.object({
  building: buildingInfoSchema,
  summary: z.object({
    mainPurpose: z.string(),
    secondaryUse: z.string().nullable().optional(),
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

export const consultationAttachmentSchema = z.object({
  name: z.string(),
  storagePath: z.string(),
  size: z.number().optional(),
  type: z.string().optional()
});

export const consultationRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  address: z.string(),
  address_detail: z.string().nullable(),
  address_code: addressCodeSchema,
  building_info: storedBuildingInfoSchema.nullable().optional(),
  main_purps: z.string().nullable(),
  tot_area: z.number().nullable(),
  plat_area: z.number().nullable(),
  ground_floor_cnt: z.number().nullable(),
  message: z.string().nullable(),
  attachments: z.array(consultationAttachmentSchema).nullable().optional(),
  created_at: z.string(),
  is_del: z.enum(['Y', 'N']),
  deleted_at: z.string().nullable().optional(),
  payment_locked: z.boolean().optional()
});

export const consultationSummarySchema = consultationRecordSchema.pick({
  id: true,
  created_at: true,
  address: true,
  address_detail: true,
  main_purps: true,
  tot_area: true,
  plat_area: true,
  ground_floor_cnt: true,
  message: true,
  email: true,
  phone: true,
  attachments: true
});

export const consultationsResponseSchema = z.object({
  consultations: z.array(consultationRecordSchema)
});

export type ConsultationRecord = z.infer<typeof consultationRecordSchema>;

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
  // 상담 요약 가독성에 필요한 문장부호는 허용하고, HTML 태그에 쓰이는 < > 등은 차단합니다.
  return value.replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9\s.,!?()[\]:;%㎡·→~\-]/g, '');
}

export { formatPhoneNumber, validatePhoneInput };
