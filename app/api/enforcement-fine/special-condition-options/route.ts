import { NextRequest, NextResponse } from 'next/server';
import { withSupabaseAuth } from '@/lib/auth/server-auth';
import { STANDARD_PRICE_YEAR } from '@/lib/enforcement-fine/constants';

const RESIDENTIAL_SPECIAL_CODES = new Set([
  'article80_small_residential_half',
  'article80_use_without_approval_residential_half',
  'article80_landscape_residential_half',
  'article80_height_residential_half',
  'article80_sunlight_residential_half',
  'article80_ordinance_residential_half'
]);

export async function GET(request: NextRequest) {
  return withSupabaseAuth(request, async ({ supabase }) => {
    try {
      const { data, error } = await supabase
        .from('enforcement_fine_special_condition_rates')
        .select(`
          code,
          label,
          condition_type,
          rate,
          multiplier,
          user_selectable,
          requires_user_confirmation,
          sort_order,
          description
        `)
        .eq('year', STANDARD_PRICE_YEAR)
        .order('condition_type', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return NextResponse.json({
        year: STANDARD_PRICE_YEAR,
        items: (data || [])
          .filter(row => row.user_selectable || RESIDENTIAL_SPECIAL_CODES.has(String(row.code)))
          .map(row => ({
          code: row.code,
          label: row.label,
          conditionType: row.condition_type,
          rate: Number(row.rate),
          multiplier: Number(row.multiplier),
          requiresUserConfirmation: row.requires_user_confirmation,
          sortOrder: row.sort_order,
          description: row.description
        }))
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : '가중·감경 항목 목록 조회 중 오류가 발생했습니다.';

      console.error('Failed to fetch enforcement fine special condition options', error);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
