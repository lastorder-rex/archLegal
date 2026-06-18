import { NextRequest } from 'next/server';
import { z } from 'zod';
import { corsJson, corsPreflight } from '@/lib/api/cors';

// 모바일 앱(이행강제금 계산기)용 건축물대장 전유부 조회 프록시.
// 공동주택의 동/호수 목록 + 호별 용도(전유부 mainPurpsCdNm)를 반환한다.
// 그룹핑/매핑은 앱에서 하므로 여기서는 원본 항목 배열만 정규화해 내려준다.

export function OPTIONS() {
  return corsPreflight();
}

const requestSchema = z.object({
  sigunguCd: z.string().length(5),
  bjdongCd: z.string().length(5),
  platGbCd: z.string().min(1).max(1),
  bun: z.string().length(4),
  ji: z.string().length(4),
});

export interface ExposUnit {
  dongNm: string | null;
  hoNm: string | null;
  mainPurpsCdNm: string | null;
  etcPurps: string | null;
  exposPubuseGbCdNm: string | null;
}

const USER_AGENT = 'archLegal/1.0';
const NUM_OF_ROWS = 100;
const MAX_PAGES = 12; // 최대 1,200세대

type AnyRecord = Record<string, unknown>;

function str(v: unknown): string | null {
  return v === undefined || v === null || v === '' ? null : String(v).trim();
}

async function fetchExposPage(
  code: z.infer<typeof requestSchema>,
  apiKey: string,
  pageNo: number
): Promise<{ items: AnyRecord[]; total: number }> {
  const url = new URL('https://apis.data.go.kr/1613000/BldRgstHubService/getBrExposInfo');
  url.searchParams.set('serviceKey', apiKey);
  url.searchParams.set('sigunguCd', code.sigunguCd);
  url.searchParams.set('bjdongCd', code.bjdongCd);
  url.searchParams.set('platGbCd', code.platGbCd);
  url.searchParams.set('bun', code.bun);
  url.searchParams.set('ji', code.ji);
  url.searchParams.set('_type', 'json');
  url.searchParams.set('numOfRows', String(NUM_OF_ROWS));
  url.searchParams.set('pageNo', String(pageNo));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) return { items: [], total: 0 };
    const data = JSON.parse(await res.text());
    const header = data?.response?.header;
    if (header?.resultCode !== '00') return { items: [], total: 0 };
    const body = data?.response?.body ?? {};
    const total = Number(body?.totalCount) || 0;
    const node = body?.items?.item ?? body?.items;
    const items: AnyRecord[] = Array.isArray(node) ? node : node ? [node] : [];
    return { items, total };
  } catch {
    return { items: [], total: 0 };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || '주소 코드를 확인해주세요.';
      return corsJson({ error: message }, { status: 400 });
    }

    const apiKey = process.env.BLD_RGST_API_KEY;
    if (!apiKey) {
      console.error('BLD_RGST_API_KEY is not configured');
      return corsJson({ ok: false, units: [], reason: 'API 키 미설정' });
    }

    const all: AnyRecord[] = [];
    const first = await fetchExposPage(parsed.data, apiKey, 1);
    all.push(...first.items);
    const pages = Math.min(Math.ceil(first.total / NUM_OF_ROWS), MAX_PAGES);
    if (pages > 1) {
      const rest = await Promise.all(
        Array.from({ length: pages - 1 }, (_, i) => fetchExposPage(parsed.data, apiKey, i + 2))
      );
      for (const r of rest) all.push(...r.items);
    }

    const units: ExposUnit[] = all.map((it) => ({
      dongNm: str(it.dongNm),
      hoNm: str(it.hoNm),
      mainPurpsCdNm: str(it.mainPurpsCdNm),
      etcPurps: str(it.etcPurps),
      exposPubuseGbCdNm: str(it.exposPubuseGbCdNm),
    }));

    return corsJson({ ok: true, units });
  } catch (error) {
    console.error('Building expose lookup failed', error);
    return corsJson(
      { error: '전유부 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
