import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(2, '이름은 2글자 이상 입력해주세요.').max(50, '이름은 50글자 이하로 입력해주세요.'),
  phone: z
    .string()
    .regex(/^010-[0-9]{4}-[0-9]{4}$/, '올바른 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)'),
  email: z
    .string()
    .email('올바른 이메일 형식을 입력해주세요.')
    .optional()
    .or(z.literal(''))
    .transform(value => (value ? value : null)),
  address: z.string().min(5, '주소를 선택해주세요.').max(200, '주소가 너무 깁니다'),
  addressCode: z.object({
    sigunguCd: z.string(),
    bjdongCd: z.string(),
    platGbCd: z.string(),
    bun: z.string(),
    ji: z.string(),
  }),
  buildingInfo: z.object({
    mainPurpsCdNm: z.string(),
    totArea: z.number().nullable().optional(),
    platArea: z.number().nullable().optional(),
    groundFloorCnt: z.number().nullable().optional(),
    ugrndFloorCnt: z.number().nullable().optional(),
    hhldCnt: z.number().nullable().optional(),
    fmlyNum: z.number().nullable().optional(),
    mainBldCnt: z.number().nullable().optional(),
    atchBldCnt: z.number().nullable().optional(),
    platPlc: z.string().nullable().optional(),
    addressInfo: z.any().optional(),
    rawData: z.any(),
  }),
  message: z
    .string()
    .max(1000, '상담 내용은 1000글자 이하로 입력해주세요.')
    .nullable()
    .optional(),
});

function buildErrorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map(issue => issue.message);
      return NextResponse.json(
        {
          error: '입력 정보를 확인해주세요.',
          details: errorMessages,
        },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return buildErrorResponse('로그인이 필요합니다.', 401);
    }

    const consultationId = params.id;

    const updatePayload = {
      name: parsed.data.name.trim(),
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      address: parsed.data.address.trim(),
      address_code: parsed.data.addressCode,
      building_info: {
        ...parsed.data.buildingInfo,
        updatedAt: new Date().toISOString(),
      },
      main_purps: parsed.data.buildingInfo.mainPurpsCdNm,
      tot_area: parsed.data.buildingInfo.totArea ?? null,
      plat_area: parsed.data.buildingInfo.platArea ?? null,
      ground_floor_cnt: parsed.data.buildingInfo.groundFloorCnt ?? null,
      message: parsed.data.message?.trim() || null,
    };

    const { error: updateError } = await supabase
      .from('consultations')
      .update(updatePayload)
      .eq('id', consultationId)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Consultation update error:', updateError);
      return buildErrorResponse('상담 요청 수정 중 오류가 발생했습니다.', 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Consultation update exception:', error);
    return buildErrorResponse('상담 요청 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return buildErrorResponse('로그인이 필요합니다.', 401);
    }

    const consultationId = params.id;

    const { error: deleteError } = await supabase
      .from('consultations')
      .update({
        is_del: 'Y',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', consultationId)
      .eq('user_id', session.user.id)
      .eq('is_del', 'N');

    if (deleteError) {
      console.error('Consultation delete error:', deleteError);
      return buildErrorResponse('상담 요청 삭제 중 오류가 발생했습니다.', 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Consultation delete exception:', error);
    return buildErrorResponse('상담 요청 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 500);
  }
}
