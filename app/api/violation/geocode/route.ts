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
        const address = it.address?.road || it.address?.parcel;
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

    let items = await vworldSearch(q, 'road');
    if (items.length === 0) items = await vworldSearch(q, 'parcel');

    // 주소 중복 제거
    const seen = new Set<string>();
    const unique = items.filter((i) => (seen.has(i.address) ? false : (seen.add(i.address), true)));

    return corsJson({ ok: true, items: unique.slice(0, 8) });
  } catch (error) {
    console.error('Geocode failed', error);
    return corsJson({ ok: false, error: '주소 검색 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
