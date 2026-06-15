import { NextRequest, NextResponse } from 'next/server';
import { withSupabaseAuth } from '@/lib/auth/server-auth';
import { STANDARD_PRICE_YEAR } from '@/lib/enforcement-fine/constants';

export async function GET(request: NextRequest) {
  return withSupabaseAuth(request, async ({ supabase }) => {
    try {
      const { data, error } = await supabase
        .from('enforcement_fine_violation_rates')
        .select(`
          code,
          label,
          formula_type,
          base_fine_rate,
          violation_rate,
          min_violation_rate,
          max_violation_rate,
          requires_local_ordinance,
          requires_user_confirmation,
          description,
          source,
          source_detail
        `)
        .eq('year', STANDARD_PRICE_YEAR)
        .eq('user_selectable', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      const items = (data || []).map(row => ({
        code: row.code,
        label: row.label,
        formulaType: row.formula_type,
        baseFineRate: row.base_fine_rate === null ? null : Number(row.base_fine_rate),
        violationRate: Number(row.violation_rate),
        minViolationRate: row.min_violation_rate === null ? null : Number(row.min_violation_rate),
        maxViolationRate: row.max_violation_rate === null ? null : Number(row.max_violation_rate),
        requiresLocalOrdinance: row.requires_local_ordinance,
        requiresUserConfirmation: row.requires_user_confirmation,
        description: row.description,
        source: row.source,
        sourceDetail: row.source_detail
      }));

      return NextResponse.json({
        year: STANDARD_PRICE_YEAR,
        items
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : '위반유형 목록 조회 중 오류가 발생했습니다.';

      console.error('Failed to fetch enforcement fine violation types', error);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
