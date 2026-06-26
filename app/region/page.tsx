import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { SEOUL_DISTRICTS } from '@/lib/constants/seoul-districts';
import { DistrictMap } from '@/components/region/DistrictMap';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '서울시 위반건축물 양성화 — 자치구별 현황 | 양성화.com',
  description:
    '서울특별시 25개 자치구별 위반건축물 등재 현황과 양성화 절차·이행강제금을 한눈에. 우리 동네 위반건축물 건수를 확인하고 내 집 주소로 즉시 진단하세요.',
  alternates: { canonical: 'https://www.archlegal.co.kr/region' },
};

async function getCounts(): Promise<Record<string, number>> {
  const sb = getSupabaseAdminClient();
  const entries = await Promise.all(
    SEOUL_DISTRICTS.map(async d => {
      const { count } = await sb
        .from('violation_buildings')
        .select('*', { count: 'exact', head: true })
        .eq('sigungu_cd', d.code);
      return [d.code, count ?? 0] as const;
    })
  );
  return Object.fromEntries(entries);
}

export default async function RegionIndexPage() {
  const counts = await getCounts();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const ordered = [...SEOUL_DISTRICTS].sort((a, b) => (counts[b.code] || 0) - (counts[a.code] || 0));

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              서울특별시 · 자치구별 현황
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              서울시 위반건축물 양성화
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              서울특별시 25개 자치구의 건축물대장상 위반건축물은 약{' '}
              <b className="text-foreground">{total.toLocaleString()}건</b>으로 집계됩니다. 우리 동네를 선택해
              현황·절차·이행강제금을 확인하세요.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl px-6 py-12">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ordered.map(d => (
              <li key={d.code}>
                <Link
                  href={`/region/${encodeURIComponent(d.name)}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition hover:border-primary hover:shadow-sm"
                >
                  <DistrictMap name={d.name} className="h-10 w-14 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-foreground">{d.name}</span>
                    <span className="block text-sm text-muted-foreground">{(counts[d.code] || 0).toLocaleString()}건</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
