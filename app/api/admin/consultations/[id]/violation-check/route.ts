import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { verifyAdminSession } from '@/lib/admin/auth';

// 상담 주소의 위반건축물 등재 여부 조회.
// consultations.address_code(jsonb) → PNU 조립 → violation_buildings 매칭.
// 수집 범위가 서울 위주라 미등재 ≠ 적법 → 지역 수집 여부를 구분해 응답한다.
//
// PNU(19) = sigunguCd(5) + bjdongCd(5) + 필지구분(1) + bun(4) + ji(4)
//   필지구분: platGbCd '0'(대지)→'1', '1'(산)→'2', 그 외 → 판정 불가(no_code)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = params.id;

    // 관리자 인증 확인
    const authResult = await verifyAdminSession();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = getSupabaseAdminClient();

    const { data: consultation, error: fetchError } = await supabase
      .from('consultations')
      .select('id, address, address_code')
      .eq('id', consultationId)
      .eq('is_del', 'N')
      .single();

    if (fetchError || !consultation) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json(
        { error: '상담 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const code = consultation.address_code as
      | { sigunguCd?: string; bjdongCd?: string; platGbCd?: string; bun?: string; ji?: string }
      | null;

    const sigunguCd = code?.sigunguCd?.trim();
    const bjdongCd = code?.bjdongCd?.trim();
    const bun = code?.bun?.trim();
    const ji = code?.ji?.trim();
    const platGbCd = code?.platGbCd?.trim();

    // 필지구분 판정: '0'(대지)→'1', '1'(산)→'2', 그 외는 판단 불가
    const platDigit = platGbCd === '0' ? '1' : platGbCd === '1' ? '2' : null;

    if (!sigunguCd || !bjdongCd || !bun || !ji || !platDigit) {
      return NextResponse.json({ ok: true, status: 'no_code' });
    }

    // PNU 조립 (bun/ji는 이미 4자리 0패딩 문자열이나 방어적으로 패딩)
    const pnu =
      sigunguCd.padStart(5, '0') +
      bjdongCd.padStart(5, '0') +
      platDigit +
      bun.padStart(4, '0') +
      ji.padStart(4, '0');

    const { data: building, error: buildingError } = await supabase
      .from('violation_buildings')
      .select('jibun, bld_nm, use_name, floors, useapr_day, collected_at, lat, lon')
      .eq('pnu', pnu)
      .maybeSingle();

    if (buildingError) {
      console.error('Violation building lookup error:', buildingError);
      return NextResponse.json(
        { error: '위반건축물 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (building) {
      return NextResponse.json({ ok: true, status: 'violation', building, pnu });
    }

    // 미매칭 → 해당 시군구 수집 여부 확인
    const { count, error: regionError } = await supabase
      .from('violation_buildings')
      .select('pnu', { count: 'exact', head: true })
      .eq('sigungu_cd', sigunguCd);

    if (regionError) {
      console.error('Violation region lookup error:', regionError);
      return NextResponse.json(
        { error: '위반건축물 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json({ ok: true, status: 'not_found', pnu });
    }

    return NextResponse.json({ ok: true, status: 'no_data_region', pnu });
  } catch (error) {
    console.error('Violation check error:', error);
    return NextResponse.json(
      { error: '위반건축물 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
