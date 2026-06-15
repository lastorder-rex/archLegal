import { NextRequest, NextResponse } from 'next/server';
import { withSupabaseAuth } from '@/lib/auth/server-auth';
import { STANDARD_PRICE_YEAR } from '@/lib/enforcement-fine/constants';

export async function GET(request: NextRequest) {
  return withSupabaseAuth(request, async ({ supabase }) => {
    try {
      const { data, error } = await supabase
        .from('standard_price_structure_indices')
        .select('id, structure_no, structure_name, structure_index, useful_life_years')
        .eq('year', STANDARD_PRICE_YEAR)
        .order('structure_no', { ascending: true })
        .order('structure_name', { ascending: true });

      if (error) {
        throw error;
      }

      return NextResponse.json({
        year: STANDARD_PRICE_YEAR,
        items: (data || []).map(row => ({
          id: row.id,
          structureNo: row.structure_no,
          name: row.structure_name,
          index: Number(row.structure_index),
          usefulLifeYears: row.useful_life_years
        }))
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : '구조지수 목록 조회 중 오류가 발생했습니다.';

      console.error('Failed to fetch enforcement fine structure options', error);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
