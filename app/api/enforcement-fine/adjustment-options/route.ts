import { NextRequest, NextResponse } from 'next/server';
import { withSupabaseAuth } from '@/lib/auth/server-auth';
import { STANDARD_PRICE_YEAR } from '@/lib/enforcement-fine/constants';

export async function GET(request: NextRequest) {
  return withSupabaseAuth(request, async ({ supabase }) => {
    try {
      const { data, error } = await supabase
        .from('standard_price_adjustment_rates')
        .select(`
          adjustment_type,
          code,
          label,
          rate,
          applies_to,
          excluded_cases,
          auto_apply,
          apply_strategy,
          condition_summary,
          user_question,
          sort_order
        `)
        .eq('year', STANDARD_PRICE_YEAR)
        .in('adjustment_type', ['increase', 'decrease'])
        .neq('apply_strategy', 'deferred')
        .order('adjustment_type', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return NextResponse.json({
        year: STANDARD_PRICE_YEAR,
        items: (data || []).map(row => ({
          adjustmentType: row.adjustment_type,
          code: row.code,
          label: row.label,
          rate: Number(row.rate),
          appliesTo: row.applies_to,
          excludedCases: row.excluded_cases,
          autoApply: row.auto_apply,
          applyStrategy: row.apply_strategy,
          conditionSummary: row.condition_summary,
          userQuestion: row.user_question,
          sortOrder: row.sort_order
        }))
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : '가산·감산 항목 목록 조회 중 오류가 발생했습니다.';

      console.error('Failed to fetch enforcement fine adjustment options', error);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
