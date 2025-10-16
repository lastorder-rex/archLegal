import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { paymentStagesResponseSchema } from '@/lib/validations/payment';
import { isUserSessionExpired, createExpiredSessionResponse } from '@/lib/auth/user-session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();

    if (isUserSessionExpired(cookieStore)) {
      return createExpiredSessionResponse('세션이 만료되었습니다. 다시 로그인해주세요.');
    }

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { data: latestConsultation } = await supabase
      .from('consultations')
      .select('id, created_at')
      .eq('user_id', session.user.id)
      .eq('is_del', 'N')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const stages = [
      {
        id: 'stage-site-survey',
        title: '1단계 · 현장 답사 및 상담 비용',
        description:
          '현장 답사를 위한 기본 상담 수수료를 결제해주세요. 결제가 완료되어야 일정 조율이 진행됩니다.',
        amount: 88000,
        status: 'awaiting' as const,
        updatedAt: latestConsultation?.created_at ?? null,
        nextActionLabel: '결제 진행'
      },
      {
        id: 'stage-legalization',
        title: '2단계 · 양성화 대행 서비스',
        description:
          '양성화 대행 계약이 확정되면 관리자가 결제를 활성화합니다. 활성화 전까지는 준비 상태로 표시됩니다.',
        amount: null,
        status: 'locked' as const,
        disabled: true,
        nextActionLabel: '관리자 승인 대기'
      }
    ];

    const parsed = paymentStagesResponseSchema.parse({ stages });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('[payments/stages] fetch error', error);
    return NextResponse.json(
      { error: '결제 단계 정보를 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
