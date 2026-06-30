import { corsJson, withApiHandler } from '@/lib/api/cors';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';

// 위반건축물 줌아웃용 집계(클러스터) 조회.
// 지도를 넓게(줌아웃) 보면 개별 마커가 1000건 제한에 걸리므로, 줌 레벨에 따라
// 구(sigungu) 또는 법정동(bjdong) 단위로 묶은 카운트+중심좌표를 반환한다.
//
// DB 뷰/함수 없이 PostgREST 페이징(.range)으로 전 행을 읽어 집계하고, 데이터가
// 수집 시에만 바뀌므로 메모리에 캐시한다(서버리스 인스턴스 단위, TTL 30분).
//
// Query: level=sigungu | bjdong (기본 sigungu)

export { corsPreflight as OPTIONS } from '@/lib/api/cors';

type Cluster = { name: string; count: number; lat: number; lon: number };

let cache: { builtAt: number; sigungu: Cluster[]; bjdong: Cluster[] } | null = null;
const TTL_MS = 1000 * 60 * 30;

async function buildAggregates() {
  const supabase = getSupabaseAdminClient();
  const rows: Array<{ sigungu_cd: string; sigungu_nm: string; bjdong_cd: string; bjdong_nm: string; lat: number; lon: number }> = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('violation_buildings')
      .select('sigungu_cd,sigungu_nm,bjdong_cd,bjdong_nm,lat,lon')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as typeof rows));
    if (data.length < pageSize) break;
  }

  const aggregate = (keyOf: (r: (typeof rows)[number]) => string, nameOf: (r: (typeof rows)[number]) => string): Cluster[] => {
    const m = new Map<string, { name: string; count: number; sumLat: number; sumLon: number }>();
    for (const r of rows) {
      const code = keyOf(r);
      if (!code) continue;
      let o = m.get(code);
      if (!o) {
        o = { name: nameOf(r), count: 0, sumLat: 0, sumLon: 0 };
        m.set(code, o);
      }
      o.count++;
      o.sumLat += r.lat;
      o.sumLon += r.lon;
    }
    return [...m.entries()].map(([, o]) => ({
      name: o.name,
      count: o.count,
      lat: +(o.sumLat / o.count).toFixed(6),
      lon: +(o.sumLon / o.count).toFixed(6),
    }));
  };

  return {
    builtAt: Date.now(),
    sigungu: aggregate((r) => r.sigungu_cd, (r) => r.sigungu_nm || ''),
    bjdong: aggregate((r) => `${r.sigungu_cd}${r.bjdong_cd}`, (r) => `${r.sigungu_nm || ''} ${r.bjdong_nm || ''}`.trim()),
  };
}

export const GET = withApiHandler(
  async (request) => {
    const level = new URL(request.url).searchParams.get('level') === 'bjdong' ? 'bjdong' : 'sigungu';
    if (!cache || Date.now() - cache.builtAt > TTL_MS) {
      cache = await buildAggregates();
    }
    const clusters = cache[level];
    return corsJson({ ok: true, clusters });
  },
  { logLabel: 'Violation clusters failed', errorMessage: '집계 조회 중 오류가 발생했습니다.' },
);
