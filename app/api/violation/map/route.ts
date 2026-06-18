import { NextRequest } from 'next/server';
import { corsJson, corsPreflight } from '@/lib/api/cors';
import oryudong from '@/lib/violation-map/oryudong.json';

// 위반건축물 지도용 마커 조회.
// 사전 수집한 캐시(scripts/collect-violations.mjs → lib/violation-map/*.json)를 읽어
// 마커 배열을 반환한다. VWorld 실시간 조회는 MAXFEATURES 1000 상한 탓에 영역이 넓으면
// 잘리므로, 배치 수집 캐시를 서빙하는 구조다.
//
// Query:
//   region        지역 키 (기본 oryudong)
//   residential   "1"이면 주거계열(단독·공동·근린)만
//   bbox          "minLat,minLon,maxLat,maxLon" 이면 해당 영역만 필터
//
// 응답: { ok, region, collectedAt, counts, useDistribution, items: [...] }

export function OPTIONS() {
  return corsPreflight();
}

type ViolationItem = {
  pnu: string;
  name: string | null;
  dong: string | null;
  useCode: string;
  useName: string;
  residential: boolean;
  floors: number | null;
  useaprDay: string | null;
  lat: number;
  lon: number;
};

type ViolationCache = {
  region: string;
  collectedAt: string;
  source: string;
  counts: { buildings: number; violations: number; residentialViolations: number };
  useDistribution: Record<string, number>;
  items: ViolationItem[];
};

const REGIONS: Record<string, ViolationCache> = {
  oryudong: oryudong as ViolationCache,
};

// PNU(19자리) → 지번주소. region을 접두사로 쓴다.
// 구조: 시군구(5)+법정동(5)+산여부(1)+본번(4)+부번(4)
function pnuToJibun(pnu: string, regionPrefix: string): string | null {
  if (!/^\d{19}$/.test(pnu)) return null;
  const san = pnu[10] === '2' ? '산 ' : '';
  const bun = parseInt(pnu.slice(11, 15), 10);
  const ji = parseInt(pnu.slice(15, 19), 10);
  if (!bun) return null;
  return `${regionPrefix} ${san}${bun}${ji ? `-${ji}` : ''}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regionKey = searchParams.get('region') || 'oryudong';
    const cache = REGIONS[regionKey];
    if (!cache) {
      return corsJson({ ok: false, error: `알 수 없는 지역: ${regionKey}` }, { status: 404 });
    }

    let items = cache.items;

    if (searchParams.get('residential') === '1') {
      items = items.filter((i) => i.residential);
    }

    const bboxParam = searchParams.get('bbox');
    if (bboxParam) {
      const parts = bboxParam.split(',').map(Number);
      if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
        const [minLat, minLon, maxLat, maxLon] = parts;
        items = items.filter(
          (i) => i.lat >= minLat && i.lat <= maxLat && i.lon >= minLon && i.lon <= maxLon
        );
      }
    }

    const withAddress = items.map((i) => ({ ...i, jibun: pnuToJibun(i.pnu, cache.region) }));

    return corsJson({
      ok: true,
      region: cache.region,
      collectedAt: cache.collectedAt,
      source: cache.source,
      counts: cache.counts,
      useDistribution: cache.useDistribution,
      total: withAddress.length,
      items: withAddress,
    });
  } catch (error) {
    console.error('Violation map lookup failed', error);
    return corsJson({ ok: false, error: '위반건축물 지도 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
