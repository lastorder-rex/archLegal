import { NextRequest, NextResponse } from 'next/server';
import { withSupabaseAuth } from '@/lib/auth/server-auth';
import { STANDARD_PRICE_YEAR } from '@/lib/enforcement-fine/constants';

const OPTION_ORDER: Record<string, number> = {
  not_applicable: 0,
  without_foundation: 10,
  with_foundation: 20,
  without_foundation_multilevel: 30
};

const OPTION_LABELS: Record<string, string> = {
  not_applicable: '해당없음',
  without_foundation: '기초공사 안 함',
  with_foundation: '기초공사 함',
  without_foundation_multilevel: '기초공사 안 함 (복층 증축)'
};

export async function GET(request: NextRequest) {
  return withSupabaseAuth(request, async ({ supabase }) => {
    try {
      const { data, error } = await supabase
        .from('standard_price_extension_ratios')
        .select('construction_type, label')
        .eq('year', STANDARD_PRICE_YEAR)
        .order('construction_type', { ascending: true });

      if (error) {
        throw error;
      }

      const optionMap = new Map<string, string>();
      optionMap.set('not_applicable', OPTION_LABELS.not_applicable);

      (data || []).forEach(row => {
        const code = String(row.construction_type);
        if (!optionMap.has(code)) {
          optionMap.set(code, OPTION_LABELS[code] || String(row.label));
        }
      });

      const items = Array.from(optionMap.entries())
        .map(([code, label]) => ({
          code,
          label,
          sortOrder: OPTION_ORDER[code] ?? 1000
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder);

      return NextResponse.json({
        year: STANDARD_PRICE_YEAR,
        items
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : '무허가 증축 기초시공 항목 목록 조회 중 오류가 발생했습니다.';

      console.error('Failed to fetch extension construction options', error);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
