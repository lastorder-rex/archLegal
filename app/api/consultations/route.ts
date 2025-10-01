import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sendConsultationNotification } from '@/lib/telegram';

// Types for request validation
interface ConsultationRequest {
  name: string;
  phone: string;
  email?: string;
  address: string;
  addressDetail?: string;
  addressCode: {
    sigunguCd: string;
    bjdongCd: string;
    platGbCd: string;
    bun: string;
    ji: string;
  };
  buildingInfo?: {
    mainPurpsCdNm: string;
    totArea: number | null;
    platArea: number | null;
    groundFloorCnt: number | null;
    rawData: any;
    [key: string]: any;
  } | null;
  message?: string;
  attachments?: {
    name: string;
    size: number;
    type: string;
    storagePath: string;
  }[];
}

function createFallbackBuildingInfo(address: string, addressCode: ConsultationRequest['addressCode']) {
  return {
    mainPurpsCdNm: '확인 필요',
    totArea: null,
    platArea: null,
    groundFloorCnt: null,
    rawData: { status: 'UNAVAILABLE' as const, address },
    addressInfo: {
      ...addressCode,
      roadAddr: address,
    }
  };
}

// Korean phone number validation
function isValidKoreanPhone(phone: string): boolean {
  return /^010-[0-9]{4}-[0-9]{4}$/.test(phone);
}

// Email validation (basic)
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Input validation function
function validateConsultationData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('이름은 2글자 이상 입력해주세요.');
  }

  if (!data.phone || !isValidKoreanPhone(data.phone)) {
    errors.push('올바른 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)');
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push('올바른 이메일 형식을 입력해주세요.');
  }

  if (!data.address || typeof data.address !== 'string' || data.address.trim().length < 5) {
    errors.push('주소를 선택해주세요.');
  }

  if (!data.addressCode ||
      !data.addressCode.sigunguCd ||
      !data.addressCode.bjdongCd ||
      !data.addressCode.platGbCd ||
      !data.addressCode.bun ||
      !data.addressCode.ji) {
    errors.push('주소 정보가 올바르지 않습니다. 주소를 다시 선택해주세요.');
  }

  if (data.message && data.message.length > 1000) {
    errors.push('상담 내용은 1000글자 이하로 입력해주세요.');
  }

  if (data.addressDetail && data.addressDetail.length > 100) {
    errors.push('상세 주소는 100글자 이하로 입력해주세요.');
  }

  if (data.attachments && data.attachments.length > 3) {
    errors.push('첨부파일은 최대 3개까지 업로드 가능합니다.');
  }

  return { valid: errors.length === 0, errors };
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ConsultationRequest = await request.json();

    // Validate input data
    const validation = validateConsultationData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: '입력 정보를 확인해주세요.', details: validation.errors },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: '인증 중 오류가 발생했습니다.' },
        { status: 401 }
      );
    }

    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Get user nickname from auth metadata
    const nickname = session.user.user_metadata?.name ||
                    session.user.user_metadata?.full_name ||
                    session.user.email?.split('@')[0] ||
                    '사용자';

    const resolvedBuildingInfo = body.buildingInfo && body.buildingInfo.mainPurpsCdNm
      ? body.buildingInfo
      : createFallbackBuildingInfo(body.address, body.addressCode);

    // Prepare consultation data
    const consultationData = {
      user_id: session.user.id,
      nickname: nickname,
      name: body.name.trim(),
      phone: body.phone,
      email: body.email?.trim() || null,
      address: body.address.trim(),
      address_detail: body.addressDetail?.trim() || null,
      address_code: body.addressCode,
      building_info: {
        ...resolvedBuildingInfo,
        queryTimestamp: new Date().toISOString()
      },
      main_purps: resolvedBuildingInfo.mainPurpsCdNm,
      tot_area: resolvedBuildingInfo.totArea ?? null,
      plat_area: resolvedBuildingInfo.platArea ?? null,
      ground_floor_cnt: resolvedBuildingInfo.groundFloorCnt ?? null,
      message: body.message?.trim() || null,
      attachments: body.attachments || [],
      is_del: 'N',
      deleted_at: null
    };

    // Insert into database
    const { data: consultation, error: insertError } = await supabase
      .from('consultations')
      .insert([consultationData])
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);

      // Handle specific database errors
      if (insertError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: '이미 등록된 상담 요청입니다.' },
          { status: 409 }
        );
      }

      if (insertError.code === '23514') { // Check constraint violation
        return NextResponse.json(
          { error: '입력 데이터 형식이 올바르지 않습니다.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: '상담 요청 등록 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 텔레그램 알림 전송 (비동기로 처리해서 응답 속도에 영향 없음)
    sendConsultationNotification({
      name: consultationData.name,
      phone: consultationData.phone,
      email: consultationData.email,
      address: consultationData.address,
      address_detail: consultationData.address_detail,
      main_purps: consultationData.main_purps,
      message: consultationData.message
    }).catch(error => {
      console.error('Telegram notification failed:', error);
      // 알림 실패는 상담 저장에 영향 없음
    });

    // Success response
    return NextResponse.json({
      success: true,
      id: consultation.id,
      message: '상담 요청이 저장되었습니다.',
      submittedAt: consultation.created_at
    }, { status: 201 });

  } catch (error) {
    console.error('Consultation submission error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '요청 데이터 형식이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '상담 요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

// GET method to retrieve user's consultations
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Get user's consultations
    const { data: consultations, error: fetchError } = await supabase
      .from('consultations')
      .select(`
        id,
        name,
        phone,
        email,
        address,
        address_detail,
        is_del,
        address_code,
        building_info,
        main_purps,
        tot_area,
        plat_area,
        ground_floor_cnt,
        message,
        attachments,
        created_at
      `)
      .eq('user_id', session.user.id)
      .eq('is_del', 'N')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json(
        { error: '상담 내역 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      consultations: consultations || []
    });

  } catch (error) {
    console.error('Consultation fetch error:', error);
    return NextResponse.json(
      { error: '상담 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
