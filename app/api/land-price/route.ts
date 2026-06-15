import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildPnu, fetchLandPrice } from '@/lib/services/land-price';

// 모바일 앱(이행강제금 계산기)용 개별공시지가 조회 프록시.
// /api/juso/search 결과의 addressCode 또는 PNU(19자리)를 받아 VWorld 공시지가를 반환한다.
// 조회 실패 시에도 200으로 reason을 내려, 앱이 수동 입력 폴백으로 전환할 수 있게 한다.

const addressCodeSchema = z.object({
  sigunguCd: z.string().length(5),
  bjdongCd: z.string().length(5),
  platGbCd: z.string().min(1).max(1),
  bun: z.string().length(4),
  ji: z.string().length(4)
});

const requestSchema = z.union([
  z.object({ pnu: z.string().regex(/^\d{19}$/, 'PNU는 19자리 숫자입니다.') }),
  z.object({ addressCode: addressCodeSchema })
]);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = requestSchema.safeParse(payload);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || '입력값을 확인해주세요.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const pnu = 'pnu' in parsed.data ? parsed.data.pnu : buildPnu(parsed.data.addressCode);
    const result = await fetchLandPrice(pnu);

    if (!result.ok) {
      return NextResponse.json({ ok: false, pnu, reason: result.reason });
    }

    const { raw: _raw, ...landPrice } = result.data;
    return NextResponse.json({ ok: true, landPrice });
  } catch (error) {
    console.error('Land price lookup failed', error);
    return NextResponse.json(
      { error: '공시지가 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
