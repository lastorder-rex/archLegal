import { NextRequest } from 'next/server';
import { corsJson, corsPreflight } from '@/lib/api/cors';

// 주소 검색(지오코딩). 지도 검색창에서 입력한 주소를 좌표 후보로 변환한다.
// VWorld 검색 API(도로명 → 지번 폴백)를 서버에서 호출(키 보호).
//
// Query: q=검색어
// 응답: { ok, items: [{ address, lat, lon }] }

export function OPTIONS() {
  return corsPreflight();
}

type Item = { address: string; lat: number; lon: number };

async function vworldSearch(query: string, category: 'road' | 'parcel'): Promise<Item[]> {
  const key = process.env.VWORLD_API_KEY;
  if (!key) return [];
  const u = new URL('https://api.vworld.kr/req/search');
  Object.entries({
    service: 'search', request: 'search', version: '2.0', crs: 'epsg:4326',
    query, type: 'address', category, format: 'json', size: '8', key,
  }).forEach(([k, v]) => u.searchParams.set(k, v));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(u.toString(), { headers: { 'User-Agent': 'archLegal/1.0' }, signal: controller.signal, cache: 'no-store' });
    const j = await res.json();
    const items = j?.response?.result?.items || [];
    return items
      .map((it: { address?: { road?: string; parcel?: string }; point?: { x: string; y: string } }) => {
        // 검색 카테고리에 맞는 주소 표기를 쓴다(parcel 검색 결과도 road 필드를 갖고 있어 혼동 방지).
        const address = category === 'road' ? it.address?.road || it.address?.parcel : it.address?.parcel || it.address?.road;
        const lat = it.point ? Number(it.point.y) : NaN;
        const lon = it.point ? Number(it.point.x) : NaN;
        if (!address || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        return { address, lat, lon };
      })
      .filter(Boolean) as Item[];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  try {
    const q = (new URL(request.url).searchParams.get('q') || '').trim();
    if (q.length < 2) return corsJson({ ok: true, items: [] });

    // 도로명/지번 둘 다 조회한 뒤, 쿼리에 '로/길'이 있으면 도로명을, 없으면 지번을 먼저 보여준다.
    // (VWorld는 지번 쿼리를 도로명으로 퍼지 매칭해 엉뚱한 결과를 주므로 둘 다 받아 정렬한다.)
    const looksRoad = /[가-힣0-9]+(로|길)(\s|\d|$)/.test(q);
    const [road, parcel] = await Promise.all([vworldSearch(q, 'road'), vworldSearch(q, 'parcel')]);
    const ordered = looksRoad ? [...road, ...parcel] : [...parcel, ...road];

    // 주소 중복 제거
    const seen = new Set<string>();
    const unique = ordered.filter((i) => (seen.has(i.address) ? false : (seen.add(i.address), true)));

    return corsJson({ ok: true, items: unique.slice(0, 8) });
  } catch (error) {
    console.error('Geocode failed', error);
    return corsJson({ ok: false, error: '주소 검색 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
