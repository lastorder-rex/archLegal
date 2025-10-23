import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { verifyAdminSession } from '@/lib/utils/admin-auth';
import { ensureConsultationDriveFolder, cancelConsultationDriveFolder } from '@/lib/services/consultation-drive-service';

type PaymentRequestPayload = {
  stageTemplateId?: string;
  amount?: number;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = params.id;
    const body: PaymentRequestPayload = await request.json().catch(() => ({}));

    // 관리자 인증 확인
    const authResult = await verifyAdminSession();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { adminId } = authResult;

    // 입력 검증
    if (!body.stageTemplateId) {
      return NextResponse.json({ error: '결제 단계를 선택해주세요.' }, { status: 400 });
    }

    if (!body.amount || Number.isNaN(body.amount) || body.amount <= 0) {
      return NextResponse.json({ error: '유효한 결제 금액을 입력해주세요. (예: 88000)' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // 상담 정보 조회
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .select('id, user_id, name')
      .eq('id', consultationId)
      .eq('is_del', 'N')
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json({ error: '해당 상담 내역을 찾을 수 없습니다. 삭제되었거나 존재하지 않는 상담입니다.' }, { status: 404 });
    }

    // 결제 단계 템플릿 조회
    const { data: stageTemplate, error: stageTemplateError } = await supabase
      .from('payment_stage_templates')
      .select('id, stage_order, code, title, description, default_amount')
      .eq('id', body.stageTemplateId)
      .eq('is_use', 'Y')
      .single();

    if (stageTemplateError || !stageTemplate) {
      return NextResponse.json({ error: '선택하신 결제 단계가 존재하지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 선행 단계 검증
    const { data: stageTemplates, error: stageTemplatesError } = await supabase
      .from('payment_stage_templates')
      .select('id, stage_order')
      .eq('is_use', 'Y')
      .order('stage_order', { ascending: true });

    if (stageTemplatesError) {
      console.error('Failed to load payment stage templates', stageTemplatesError);
      return NextResponse.json({ error: '시스템 오류로 결제 단계 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
    }

    const { data: userStageStatuses, error: userStageStatusError } = await supabase
      .from('user_payment_stages')
      .select('stage_template_id, status')
      .eq('user_id', consultation.user_id);

    if (userStageStatusError) {
      console.error('Failed to fetch user stage statuses', userStageStatusError);
      return NextResponse.json({ error: '시스템 오류로 사용자의 결제 이력을 확인할 수 없습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
    }

    const statusMap = new Map((userStageStatuses ?? []).map(row => [row.stage_template_id, row.status]));
    const currentStatus = statusMap.get(stageTemplate.id);

    // 중복 요청 확인
    if (currentStatus && currentStatus !== 'locked') {
      return NextResponse.json({
        error: `이미 ${stageTemplate.title} 결제 요청이 진행 중입니다. 기존 요청을 취소한 뒤 다시 시도해주세요.`
      }, { status: 400 });
    }

    const prerequisites = (stageTemplates ?? []).filter(template => template.stage_order < stageTemplate.stage_order);
    const unmetPrerequisite = prerequisites.find(template => statusMap.get(template.id) !== 'paid');

    if (unmetPrerequisite) {
      return NextResponse.json({
        error: `${stageTemplate.title} 결제는 이전 단계가 모두 완료되어야 요청할 수 있습니다.`
      }, { status: 400 });
    }

    // Upsert로 Race Condition 방지
    // 단, Supabase는 조건부 upsert를 지원하지 않으므로
    // INSERT ... ON CONFLICT ... DO UPDATE WHERE 구문을 사용
    // locked 상태에서만 업데이트하도록 제한
    let userStageId: string | null = null;

    if (!currentStatus) {
      // 신규 생성
      const { data: inserted, error: insertError } = await supabase
        .from('user_payment_stages')
        .insert({
          user_id: consultation.user_id,
          consultation_id: consultation.id,
          stage_template_id: stageTemplate.id,
          status: 'awaiting',
          request_amount: body.amount,
          requested_at: now,
          requested_by: adminId,
          updated_at: now
        })
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('Failed to insert payment stage', insertError);
        if ((insertError as any)?.code === '23505') {
          return NextResponse.json({ error: '동시에 여러 요청이 발생했습니다. 페이지를 새로고침 후 다시 시도해주세요.' }, { status: 400 });
        }
        return NextResponse.json({ error: '데이터베이스 오류로 결제 요청을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
      }

      if (!inserted) {
        return NextResponse.json({ error: '결제 요청 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
      }

      userStageId = inserted.id;
    } else if (currentStatus === 'locked') {
      // locked 상태에서만 업데이트
      const { data: updated, error: updateError } = await supabase
        .from('user_payment_stages')
        .update({
          status: 'awaiting',
          request_amount: body.amount,
          requested_at: now,
          requested_by: adminId,
          updated_at: now
        })
        .eq('user_id', consultation.user_id)
        .eq('stage_template_id', stageTemplate.id)
        .eq('status', 'locked')  // Race condition 방지: locked 상태일 때만 업데이트
        .select()
        .maybeSingle();

      if (updateError) {
        console.error('Failed to update payment stage', updateError);
        return NextResponse.json({ error: '데이터베이스 오류로 결제 요청을 저장할 수 없습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
      }

      if (!updated) {
        // 다른 요청이 먼저 상태를 변경함
        return NextResponse.json({ error: '동시에 여러 요청이 발생했습니다. 페이지를 새로고침 후 다시 시도해주세요.' }, { status: 400 });
      }

      userStageId = updated.id;
    } else {
      // 이미 awaiting 또는 paid 상태 - 여기 도달하면 안 됨 (위에서 검증했음)
      return NextResponse.json({
        error: `이미 ${stageTemplate.title} 결제 요청이 진행 중입니다. 기존 요청을 취소한 뒤 다시 시도해주세요.`
      }, { status: 400 });
    }

    if (!userStageId) {
      return NextResponse.json({ error: '결제 요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
    }

    try {
      await ensureConsultationDriveFolder({
        supabase,
        consultationId: consultation.id,
        userPaymentStageId: userStageId,
        requestAmount: Number(body.amount)
      });
    } catch (driveError) {
      console.error('Failed to create consultation drive folder', driveError);
      await supabase
        .from('user_payment_stages')
        .update({
          status: 'locked',
          request_amount: null,
          requested_at: null,
          requested_by: null,
          updated_at: now
        })
        .eq('id', userStageId);

      return NextResponse.json({
        error: '문서 폴더 자동 생성에 실패했습니다. 다시 시도해주세요.'
      }, { status: 500 });
    }

    // 알림 생성 (에러 발생 시 결제 단계도 롤백)
    const { error: notificationError } = await supabase
      .from('payment_notifications')
      .insert({
        user_payment_stage_id: userStageId,
        notification_type: 'payment_request_created',
        payload: {
          stageTemplateId: stageTemplate.id,
          userId: consultation.user_id,
          consultationId: consultation.id,
          amount: body.amount,
          requestedBy: adminId,
          requestedAt: now
        }
      })
      .select()
      .maybeSingle();

    if (notificationError) {
      console.error('Failed to create payment notification', notificationError);
      // 알림 생성 실패 시 결제 단계 롤백
      await supabase
        .from('user_payment_stages')
        .update({
          status: 'locked',
          request_amount: null,
          requested_at: null,
          requested_by: null,
          updated_at: now
        })
        .eq('id', userStageId);

      return NextResponse.json({ error: '알림 생성 중 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 });
    }

    // 최종 결과 조회
    const { data: userStageRow, error: userStageFetchError } = await supabase
      .from('user_payment_stages')
      .select('status, request_amount, requested_at, requested_by, paid_at, paid_amount, payment_key, updated_at')
      .eq('user_id', consultation.user_id)
      .eq('stage_template_id', stageTemplate.id)
      .single();

    if (userStageFetchError || !userStageRow) {
      return NextResponse.json({ error: '결제 요청은 완료되었으나 결과를 확인할 수 없습니다. 페이지를 새로고침해주세요.' }, { status: 500 });
    }

    return NextResponse.json({
      paymentStage: {
        stageTemplateId: stageTemplate.id,
        stageOrder: stageTemplate.stage_order,
        code: stageTemplate.code,
        title: stageTemplate.title,
        description: stageTemplate.description,
        defaultAmount: stageTemplate.default_amount !== null ? Number(stageTemplate.default_amount) : null,
        status: userStageRow.status,
        requestAmount: userStageRow.request_amount !== null ? Number(userStageRow.request_amount) : null,
        requestedAt: userStageRow.requested_at,
        requestedBy: userStageRow.requested_by,
        paidAt: userStageRow.paid_at,
        paidAmount: userStageRow.paid_amount !== null ? Number(userStageRow.paid_amount) : null,
        paymentKey: userStageRow.payment_key,
        updatedAt: userStageRow.updated_at
      }
    });
  } catch (error) {
    console.error('Payment request creation error', error);
    return NextResponse.json({ error: '알 수 없는 오류가 발생했습니다. 페이지를 새로고침 후 다시 시도해주세요.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = params.id;
    const body: PaymentRequestPayload = await request.json().catch(() => ({}));

    // 관리자 인증 확인
    const authResult = await verifyAdminSession();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { adminId } = authResult;

    // 입력 검증
    if (!body.stageTemplateId) {
      return NextResponse.json({ error: '취소할 결제 단계를 선택해주세요.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // 상담 정보 조회
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .select('id, user_id')
      .eq('id', consultationId)
      .eq('is_del', 'N')
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json({ error: '해당 상담 내역을 찾을 수 없습니다. 삭제되었거나 존재하지 않는 상담입니다.' }, { status: 404 });
    }

    // 결제 단계 템플릿 조회
    const { data: stageTemplate, error: stageTemplateError } = await supabase
      .from('payment_stage_templates')
      .select('id, stage_order, code, title, description, default_amount')
      .eq('id', body.stageTemplateId)
      .eq('is_use', 'Y')
      .single();

    if (stageTemplateError || !stageTemplate) {
      return NextResponse.json({ error: '선택하신 결제 단계가 존재하지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 결제 단계 조회
    const { data: existingStage, error: existingStageError } = await supabase
      .from('user_payment_stages')
      .select('id, status')
      .eq('user_id', consultation.user_id)
      .eq('stage_template_id', stageTemplate.id)
      .maybeSingle();

    if (existingStageError) {
      console.error('Failed to check payment stage', existingStageError);
      return NextResponse.json({ error: '시스템 오류로 결제 단계 정보를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
    }

    if (existingStage?.status === 'paid') {
      return NextResponse.json({ error: `이미 결제가 완료된 ${stageTemplate.title}는 취소할 수 없습니다.` }, { status: 400 });
    }

    // 결제 요청 취소
    if (existingStage?.id) {
      const { error: clearError } = await supabase
        .from('user_payment_stages')
        .update({
          status: 'locked',
          request_amount: null,
          requested_at: null,
          requested_by: null,
          updated_at: now
        })
        .eq('id', existingStage.id);

      if (clearError) {
        console.error('Failed to cancel payment stage', clearError);
        return NextResponse.json({ error: '데이터베이스 오류로 결제 요청을 취소할 수 없습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
      }

      try {
        await supabase
          .from('payment_notifications')
          .insert({
            user_payment_stage_id: existingStage.id,
            notification_type: 'payment_request_cancelled',
            payload: {
              stageTemplateId: stageTemplate.id,
              userId: consultation.user_id,
              consultationId: consultation.id,
              cancelledBy: adminId,
              cancelledAt: now
            }
          });
      } catch (error) {
        console.error('Failed to enqueue cancellation notification', error);
      }

      try {
        await cancelConsultationDriveFolder({
          supabase,
          consultationId: consultation.id,
          userPaymentStageId: existingStage.id
        });
      } catch (driveError) {
        console.error('Failed to delete consultation drive folder', driveError);
        return NextResponse.json({
          error: '폴더 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment request cancel error', error);
    return NextResponse.json({ error: '알 수 없는 오류가 발생했습니다. 페이지를 새로고침 후 다시 시도해주세요.' }, { status: 500 });
  }
}
