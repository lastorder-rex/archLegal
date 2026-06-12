import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSupabaseAuth } from '@/lib/auth/server-auth';
import { prepareEnforcementFine } from '@/lib/enforcement-fine/prepare';

const addressCodeSchema = z.object({
  sigunguCd: z.string().min(5),
  bjdongCd: z.string().min(5),
  platGbCd: z.string().min(1),
  bun: z.string().min(4),
  ji: z.string().min(4),
  sigunguName: z.string().optional(),
  bjdongName: z.string().optional()
});

const prepareSchema = z.object({
  address: z.string().trim().min(2).optional(),
  roadAddress: z.string().trim().optional(),
  jibunAddress: z.string().trim().optional(),
  addressCode: addressCodeSchema.optional(),
  dongName: z.string().trim().optional(),
  hoName: z.string().trim().optional()
}).refine(
  value => Boolean(value.address || value.addressCode),
  { message: '주소 또는 주소코드가 필요합니다.' }
);

export async function POST(request: NextRequest) {
  return withSupabaseAuth(request, async () => {
    try {
      const payload = await request.json();
      const parsed = prepareSchema.safeParse(payload);

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message || '입력값을 확인해주세요.';
        return NextResponse.json({ error: message }, { status: 400 });
      }

      const result = await prepareEnforcementFine(parsed.data);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : '이행강제금 계산 준비 중 오류가 발생했습니다.';

      console.error('Failed to prepare enforcement fine data', error);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
