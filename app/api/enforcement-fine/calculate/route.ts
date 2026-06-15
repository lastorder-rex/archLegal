import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSupabaseAuth } from '@/lib/auth/server-auth';
import { calculateEnforcementFine, UnsupportedCalculationError } from '@/lib/enforcement-fine/calculate';

const addressCodeSchema = z.object({
  sigunguCd: z.string().min(5),
  bjdongCd: z.string().min(5),
  platGbCd: z.string().min(1),
  bun: z.string().min(4),
  ji: z.string().min(4),
  sigunguName: z.string().optional(),
  bjdongName: z.string().optional()
});

const areaSchema = z.coerce.number()
  .positive()
  .max(99999.99, { message: '위반면적은 정수부 최대 5자리까지만 입력해주세요.' })
  .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 1e-9, {
    message: '위반면적은 소수점 2자리까지만 입력해주세요.'
  });

const calculateSchema = z.object({
  address: z.string().trim().min(2).optional(),
  roadAddress: z.string().trim().optional(),
  jibunAddress: z.string().trim().optional(),
  addressCode: addressCodeSchema.optional(),
  dongName: z.string().trim().optional(),
  hoName: z.string().trim().optional(),
  preparedData: z.record(z.string(), z.any()).optional(),
  violationAreaM2: areaSchema.optional(),
  violationAreaPyeong: areaSchema.optional(),
  violationType: z.string().trim().min(2),
  violationCompletedYear: z.coerce.number()
    .int()
    .min(1900)
    .max(2026)
    .refine(value => /^\d{4}$/.test(String(value)), {
      message: '위반완료연도는 YYYY 형식 4자리로 입력해주세요.'
    })
    .optional(),
  violationCompletedYearUnknown: z.boolean().optional(),
  violationStructureIndexId: z.string().uuid().optional(),
  violationUseIndexId: z.string().uuid().optional(),
  extensionConstructionType: z.enum([
    'not_applicable',
    'with_foundation',
    'without_foundation',
    'without_foundation_multilevel'
  ]).optional(),
  majorRepairApprovalType: z.enum(['permit', 'report']).optional(),
  majorRepairRoofReductionApplied: z.boolean().optional(),
  specialConditionFlags: z.object({
    acquiredAfterViolation: z.boolean().optional(),
    forProfitPurpose: z.boolean().optional(),
    repeatedViolation: z.boolean().optional()
  }).optional(),
  selectedAdjustmentCodes: z.array(z.string().trim().min(1)).optional(),
  selectedSpecialConditionCodes: z.array(z.string().trim().min(1)).optional(),
  excludedAppliedAdjustmentCodes: z.array(z.string().trim().min(1)).optional(),
  reductionFlags: z.record(z.string(), z.any()).optional(),
  increaseFlags: z.record(z.string(), z.any()).optional(),
  consultationId: z.string().uuid().optional()
}).refine(
  value => Boolean(value.violationAreaM2 || value.violationAreaPyeong),
  { message: '위반면적을 입력해주세요.' }
).refine(
  value => Boolean(value.preparedData || value.address || value.addressCode),
  { message: '주소 또는 준비된 계산 데이터가 필요합니다.' }
);

export async function POST(request: NextRequest) {
  return withSupabaseAuth(request, async ({ supabase, userId }) => {
    try {
      const payload = await request.json();
      const parsed = calculateSchema.safeParse(payload);

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message || '입력값을 확인해주세요.';
        return NextResponse.json({ error: message }, { status: 400 });
      }

      const result = await calculateEnforcementFine(parsed.data, { supabase, userId });
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : '이행강제금 계산 중 오류가 발생했습니다.';

      if (error instanceof UnsupportedCalculationError) {
        return NextResponse.json({ error: message }, { status: 400 });
      }

      console.error('Failed to calculate enforcement fine', error);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
