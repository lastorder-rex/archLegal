import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { verifyAdminSession } from '@/lib/utils/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authResult = await verifyAdminSession();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('payment_stage_templates')
      .select('id, stage_order, code, title, description, default_amount, is_use')
      .order('stage_order', { ascending: true });

    if (error) {
      console.error('[admin/payments/templates] fetch error', error);
      return NextResponse.json({ error: '결제 단계 정보를 불러오지 못했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      templates: (data ?? []).map((row) => ({
        id: row.id,
        stageOrder: row.stage_order,
        code: row.code,
        title: row.title,
        description: row.description,
        defaultAmount: row.default_amount !== null ? Number(row.default_amount) : null,
        isUse: row.is_use === 'Y'
      }))
    });
  } catch (error) {
    console.error('[admin/payments/templates] unexpected error', error);
    return NextResponse.json({ error: '결제 단계 정보를 불러오지 못했습니다.' }, { status: 500 });
  }
}
