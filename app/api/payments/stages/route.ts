import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { paymentStageStatusSchema, paymentStagesResponseSchema } from '@/lib/validations/payment';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Supabase 세션으로 통일 (이중 검증 제거)
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: '세션이 만료되었습니다. 다시 로그인해주세요.' }, { status: 401 });
    }

    const { data: stageTemplates, error: stageTemplateError } = await supabase
      .from('payment_stage_templates')
      .select('id, stage_order, code, title, description, default_amount, updated_at')
      .order('stage_order', { ascending: true });

    if (stageTemplateError) {
      console.error('[payments/stages] failed to load templates', stageTemplateError);
      return NextResponse.json({ error: '결제 단계 정보를 불러올 수 없습니다.' }, { status: 500 });
    }

    const { data: userStageRows, error: userStagesError } = await supabase
      .from('user_payment_stages')
      .select('stage_template_id, status, request_amount, requested_at, paid_at, paid_amount, payment_key, updated_at')
      .eq('user_id', session.user.id);

    if (userStagesError) {
      console.error('[payments/stages] failed to load user stages', userStagesError);
      return NextResponse.json({ error: '결제 단계 정보를 불러올 수 없습니다.' }, { status: 500 });
    }

    const stageMap = new Map((userStageRows ?? []).map(row => [row.stage_template_id, row]));

    const stages = (stageTemplates ?? []).map(template => {
      const matched = stageMap.get(template.id);
      const rawStatus = matched?.status ?? 'locked';
      const parsedStatus = paymentStageStatusSchema.safeParse(rawStatus);
      const status = parsedStatus.success ? parsedStatus.data : 'locked';

      const previousStages = (stageTemplates ?? []).filter(item => item.stage_order < template.stage_order);
      const prerequisitesPaid = previousStages.every(item => {
        const previous = stageMap.get(item.id);
        return (previous?.status ?? 'locked') === 'paid';
      });

      const disabled = status === 'locked' ? !prerequisitesPaid : false;
      const nextActionLabel = status === 'awaiting' ? '결제 진행' : null;

      const requestAmount = matched && matched.request_amount !== null ? Number(matched.request_amount) : null;
      const paidAmount = matched && matched.paid_amount !== null ? Number(matched.paid_amount) : null;

      return {
        id: template.id,
        stageTemplateId: template.id,
        stageOrder: template.stage_order,
        code: template.code,
        title: template.title,
        description: template.description ?? null,
        defaultAmount: template.default_amount !== null ? Number(template.default_amount) : null,
        status,
        requestAmount,
        requestedAt: matched?.requested_at ?? null,
        paidAt: matched?.paid_at ?? null,
        paidAmount,
        paymentKey: matched?.payment_key ?? null,
        updatedAt: matched?.updated_at ?? template.updated_at ?? null,
        nextActionLabel,
        disabled
      };
    });

    const payload = paymentStagesResponseSchema.parse({ stages });

    return NextResponse.json(payload);
  } catch (error) {
    console.error('[payments/stages] fetch error', error);
    return NextResponse.json(
      { error: '결제 단계 정보를 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
