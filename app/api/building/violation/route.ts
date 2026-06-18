import { NextRequest } from 'next/server';
import { z } from 'zod';
import { buildPnu } from '@/lib/services/land-price';
import { corsJson, corsPreflight } from '@/lib/api/cors';

// 모바일 앱(이행강제금 계산기)용 위반건축물 여부 조회 프록시.
// VWorld WFS lt_c_bldginfo 레이어의 viol_bd_yn(위반건축물 여부)을 PNU 필터로 조회한다.
// 응답이 XML(GML)이라 viol_bd_yn 값을 정규식으로 읽는다.
//  - violation=true  : 위반건축물 등재
//  - violation=false : 등재 없음
//  - violation=null  : 조회 불가/미응답

export function OPTIONS() {
  return corsPreflight();
}

const addressCodeSchema = z.object({
  sigunguCd: z.string().length(5),
  bjdongCd: z.string().length(5),
  platGbCd: z.string().min(1).max(1),
  bun: z.string().length(4),
  ji: z.string().length(4),
});

const requestSchema = z.union([
  z.object({ pnu: z.string().regex(/^\d{19}$/, 'PNU는 19자리 숫자입니다.') }),
  z.object({ addressCode: addressCodeSchema }),
]);

const USER_AGENT = 'archLegal/1.0';

export async function POST(request: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || '입력값을 확인해주세요.';
      return corsJson({ error: message }, { status: 400 });
    }

    const apiKey = process.env.VWORLD_API_KEY;
    if (!apiKey) {
      console.error('VWORLD_API_KEY is not configured');
      return corsJson({ ok: false, violation: null, reason: 'API 키 미설정' });
    }

    const pnu = 'pnu' in parsed.data ? parsed.data.pnu : buildPnu(parsed.data.addressCode);
    const domain = (process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3002').replace(/^https?:\/\//, '');

    const url = new URL('https://api.vworld.kr/req/wfs');
    url.searchParams.set('SERVICE', 'WFS');
    url.searchParams.set('REQUEST', 'GetFeature');
    url.searchParams.set('TYPENAME', 'lt_c_bldginfo');
    url.searchParams.set('VERSION', '1.1.0');
    url.searchParams.set('KEY', apiKey);
    url.searchParams.set('DOMAIN', domain);
    url.searchParams.set('MAXFEATURES', '30');
    url.searchParams.set('PROPERTYNAME', 'pnu,viol_bd_yn');
    url.searchParams.set(
      'FILTER',
      `<Filter><PropertyIsEqualTo><PropertyName>pnu</PropertyName><Literal>${pnu}</Literal></PropertyIsEqualTo></Filter>`
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    let xml: string;
    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      xml = await res.text();
    } catch (err) {
      console.error('[VWorld WFS] fetch failed', { pnu, err });
      return corsJson({ ok: false, pnu, violation: null, reason: 'VWorld 요청 실패' });
    } finally {
      clearTimeout(timeoutId);
    }

    const values = [...xml.matchAll(/<(?:\w+:)?viol_bd_yn>\s*([^<\s]+)\s*<\/(?:\w+:)?viol_bd_yn>/g)].map(
      (m) => m[1]
    );

    // 값이 하나도 없으면 판단 불가(null), 있으면 그중 하나라도 1이면 위반건축물.
    const violation = values.length === 0 ? null : values.includes('1');
    return corsJson({ ok: true, pnu, violation });
  } catch (error) {
    console.error('Building violation lookup failed', error);
    return corsJson(
      { error: '위반건축물 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
