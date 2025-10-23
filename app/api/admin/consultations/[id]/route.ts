import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { paymentStageStatusSchema } from '@/lib/validations/payment';
import { verifyAdminSession } from '@/lib/utils/admin-auth';

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

    // Get consultation by ID
    const { data: consultation, error: fetchError } = await supabase
      .from('consultations')
      .select(`
        id,
        user_id,
        nickname,
        name,
        phone,
        email,
        address,
        address_detail,
        address_code,
        building_info,
        main_purps,
        tot_area,
        plat_area,
        ground_floor_cnt,
        message,
        attachments,
        is_del,
        created_at,
        updated_at
      `)
      .eq('id', consultationId)
      .eq('is_del', 'N')
      .single();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json(
        { error: '상담 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const { data: stageTemplates, error: stageTemplateError } = await supabase
      .from('payment_stage_templates')
      .select('id, stage_order, code, title, description, default_amount, updated_at')
      .eq('is_use', 'Y')
      .order('stage_order', { ascending: true });

    if (stageTemplateError) {
      console.error('Failed to load payment stage templates', stageTemplateError);
      return NextResponse.json(
        { error: '결제 단계 정보를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    const { data: userStageRows, error: userStagesError } = await supabase
      .from('user_payment_stages')
      .select(`
        id,
        stage_template_id,
        status,
        request_amount,
        requested_at,
        requested_by,
        paid_at,
        paid_amount,
        payment_key,
        updated_at
      `)
      .eq('user_id', consultation.user_id);

    if (userStagesError) {
      console.error('Failed to load user payment stages', userStagesError);
      return NextResponse.json(
        { error: '결제 단계 정보를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    const stageMap = new Map(
      (userStageRows ?? []).map(stage => [stage.stage_template_id, stage])
    );

    const paymentStages = (stageTemplates ?? []).map(template => {
      const matchedStage = stageMap.get(template.id);
      const status = matchedStage?.status ?? 'locked';
      const parsedStatus = paymentStageStatusSchema.safeParse(status);

      const requestAmount =
        matchedStage && matchedStage.request_amount !== null
          ? Number(matchedStage.request_amount)
          : null;

      const paidAmount =
        matchedStage && matchedStage.paid_amount !== null
          ? Number(matchedStage.paid_amount)
          : null;

      const prerequisites = (stageTemplates ?? []).filter(other => other.stage_order < template.stage_order);
      const prerequisitesPaid = prerequisites.every(other => {
        const previous = stageMap.get(other.id);
        return (previous?.status ?? 'locked') === 'paid';
      });
      const disabled =
        parsedStatus.success && parsedStatus.data === 'locked' ? !prerequisitesPaid : false;

      return {
        id: template.id,
        stageTemplateId: template.id,
        stageOrder: template.stage_order,
        code: template.code,
        title: template.title,
        description: template.description ?? null,
        defaultAmount: template.default_amount !== null ? Number(template.default_amount) : null,
        status: parsedStatus.success ? parsedStatus.data : 'locked',
        requestAmount,
        requestedAt: matchedStage?.requested_at ?? null,
        requestedBy: matchedStage?.requested_by ?? null,
        paidAt: matchedStage?.paid_at ?? null,
        paidAmount,
        paymentKey: matchedStage?.payment_key ?? null,
        updatedAt: matchedStage?.updated_at ?? template.updated_at ?? null,
        nextActionLabel: parsedStatus.success && parsedStatus.data === 'awaiting' ? '결제 진행' : null,
        disabled
      };
    });

    return NextResponse.json({
      consultation,
      paymentStages
    });

  } catch (error) {
    console.error('Admin consultation fetch error:', error);
    return NextResponse.json(
      { error: '상담 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
