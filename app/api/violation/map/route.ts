import { NextRequest } from 'next/server';
import { corsJson, corsPreflight } from '@/lib/api/cors';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';

// 위반건축물 지도용 마커 조회 (Supabase).
// 지도는 화면 영역(bbox)으로 조회한다 → 서울·전국으로 데이터가 늘어도 화면에 보이는
// 것만 전송. scripts/collect-violations.mjs 가 violation_buildings 테이블을 채운다.
//
// Query:
//   bbox=minLat,minLon,maxLat,maxLon  화면 영역(권장, 넓으면 limit에 걸림)
//   sigungu=11530                     시군구 코드 필터
//   residential=1                     주거계열(단독·공동·근린)만
//   limit=2000                        최대 건수(기본 3000)

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from('violation_buildings')
      .select('pnu,bld_nm,jibun,sigungu_nm,bjdong_nm,use_code,use_name,residential,floors,useapr_day,lat,lon');

    const sigungu = searchParams.get('sigungu');
    if (sigungu) query = query.eq('sigungu_cd', sigungu);

    if (searchParams.get('residential') === '1') query = query.eq('residential', true);

    const bboxParam = searchParams.get('bbox');
    if (bboxParam) {
      const p = bboxParam.split(',').map(Number);
      if (p.length === 4 && p.every((n) => Number.isFinite(n))) {
        const [minLat, minLon, maxLat, maxLon] = p;
        query = query.gte('lat', minLat).lte('lat', maxLat).gte('lon', minLon).lte('lon', maxLon);
      }
    }

    const limit = Math.min(Number(searchParams.get('limit')) || 3000, 5000);
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error('violation_buildings query failed', error);
      return corsJson({ ok: false, error: '데이터 조회 실패' }, { status: 500 });
    }

    const items = (data || []).map((r) => ({
      pnu: r.pnu,
      name: r.bld_nm,
      jibun: r.jibun,
      sigunguNm: r.sigungu_nm,
      bjdongNm: r.bjdong_nm,
      useCode: r.use_code,
      useName: r.use_name,
      residential: r.residential,
      floors: r.floors,
      useaprDay: r.useapr_day,
      lat: r.lat,
      lon: r.lon,
    }));

    return corsJson({ ok: true, total: items.length, items });
  } catch (error) {
    console.error('Violation map lookup failed', error);
    return corsJson({ ok: false, error: '위반건축물 지도 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
