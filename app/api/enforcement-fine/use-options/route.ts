import { NextRequest, NextResponse } from 'next/server';
import { withSupabaseAuth } from '@/lib/auth/server-auth';
import { STANDARD_PRICE_YEAR } from '@/lib/enforcement-fine/constants';

export async function GET(request: NextRequest) {
  return withSupabaseAuth(request, async ({ supabase }) => {
    try {
      const { data, error } = await supabase
        .from('standard_price_use_indices')
        .select('id, category_code, category_name, main_use, use_no, detail_use, use_index')
        .eq('year', STANDARD_PRICE_YEAR)
        .order('category_code', { ascending: true })
        .order('use_no', { ascending: true })
        .order('detail_use', { ascending: true });

      if (error) {
        throw error;
      }

      return NextResponse.json({
        year: STANDARD_PRICE_YEAR,
        items: (data || []).map(row => ({
          id: row.id,
          categoryCode: row.category_code,
          categoryName: row.category_name,
          mainUse: row.main_use,
          useNo: row.use_no,
          detailUse: row.detail_use,
          index: Number(row.use_index)
        }))
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : '용도지수 목록 조회 중 오류가 발생했습니다.';

      console.error('Failed to fetch enforcement fine use options', error);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
