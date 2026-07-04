import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Building2, MapPin, Search, ShieldCheck } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { getDistrictYearlyTotals, formatEokKrw, perCaseManKrw } from '@/lib/stats/enforcement-penalty';
import { SEOUL_DISTRICTS, findSeoulDistrict } from '@/lib/constants/seoul-districts';
import { DistrictMap } from '@/components/region/DistrictMap';
import { RegionConsultationCta } from '@/components/region/RegionConsultationCta';

export const revalidate = 86400; // 하루 1회 재생성(데이터 갱신 반영)

// 빌드 타임에 서울 25개 자치구 페이지를 정적 생성.
// 그 외 자치구 이름은 findSeoulDistrict가 못 찾아 notFound()로 404 처리되므로 사실상 서울 전용.
export function generateStaticParams() {
  return SEOUL_DISTRICTS.map(d => ({ region: d.name }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 지역별 위반건축물 프로그래matic SEO 페이지.
// 템플릿 1개 + violation_buildings 데이터 → 자치구마다 1페이지 자동 생성.
// (예: /region/구로구, /region/강남구 …) — 지역의 실제 위반 통계로 카피 불가 콘텐츠.
// 집계 기준은 sigungu_cd(코드) — 이름만으로는 '중구' 등 타 시도와 충돌하기 때문.
// ─────────────────────────────────────────────────────────────────────────────

type RegionStats = {
  total: number;
  residentialPct: number;
  uses: { name: string; count: number }[];
  dongs: { name: string; count: number }[];
};

async function getRegionStats(region: string): Promise<RegionStats | null> {
  const district = findSeoulDistrict(region);
  if (!district) return null;
  const sb = getSupabaseAdminClient();
  const rows: { use_name: string | null; residential: boolean | null; bjdong_nm: string | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from('violation_buildings')
      .select('use_name,residential,bjdong_nm')
      .eq('sigungu_cd', district.code)
      .range(from, from + 999);
    if (error || !data || data.length === 0) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  if (rows.length === 0) return null;

  const res = rows.filter(r => r.residential).length;
  const tally = (key: 'use_name' | 'bjdong_nm') => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = (r[key] || '').trim();
      if (!k) continue;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  };

  return {
    total: rows.length,
    residentialPct: Math.round((res / rows.length) * 100),
    uses: tally('use_name').slice(0, 5),
    dongs: tally('bjdong_nm').slice(0, 6),
  };
}

export async function generateMetadata({ params }: { params: { region: string } }): Promise<Metadata> {
  const region = decodeURIComponent(params.region);
  const stats = await getRegionStats(region);
  const title = `${region} 위반건축물 양성화 — 현황·절차·이행강제금 | 양성화.com`;
  const description = stats
    ? `${region}의 위반건축물은 약 ${stats.total.toLocaleString()}건(주거용 ${stats.residentialPct}%)으로 집계됩니다. ${region} 위반건축물 양성화 가능성·절차·이행강제금을 확인하고 내 집 주소로 즉시 진단하세요.`
    : `${region} 위반건축물 양성화 절차와 이행강제금을 안내합니다.`;
  return {
    title,
    description,
    alternates: { canonical: `https://www.archlegal.co.kr/region/${encodeURIComponent(region)}` },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function RegionPage({ params }: { params: { region: string } }) {
  const region = decodeURIComponent(params.region);
  const stats = await getRegionStats(region);
  if (!stats) notFound();
  const penaltyYearly = await getDistrictYearlyTotals(region);
  const latestPenalty = penaltyYearly[penaltyYearly.length - 1];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${region}에 위반건축물이 얼마나 있나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${region}의 건축물대장상 위반건축물은 약 ${stats.total.toLocaleString()}건으로 집계되며, 그중 주거용이 약 ${stats.residentialPct}%입니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `${region} 위반건축물도 양성화가 가능한가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: '특정건축물 정리에 관한 특별조치법(2026.12.17 시행, 18개월 한시) 대상이라면 양성화(추인·신고·허가)가 가능할 수 있습니다. 완공시점·면적·구역 기준에 따라 달라지므로 주소 기반 진단을 권합니다.',
        },
      },
      ...(latestPenalty
        ? [
            {
              '@type': 'Question',
              name: `${region}에서 이행강제금은 얼마나 부과되나요?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `${region}에서는 ${latestPenalty.report_year}년 기준 이행강제금이 약 ${latestPenalty.assessment_count.toLocaleString()}건, ${formatEokKrw(latestPenalty.assessment_amount_thousand_krw)} 부과되었습니다. 건당 평균은 약 ${perCaseManKrw(latestPenalty.assessment_amount_thousand_krw, latestPenalty.assessment_count).toLocaleString()}만 원이며, 위반이 시정될 때까지 매년 반복 부과될 수 있습니다.`,
              },
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen bg-background">
        {/* 히어로 */}
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 sm:py-16 lg:flex-row lg:items-center">
            <div className="lg:flex-1">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {region} · 위반건축물 양성화
              </p>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                {region} 위반건축물 양성화
                <br className="hidden sm:block" /> 현황·절차·이행강제금
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                {region}의 건축물대장상 위반건축물은 약 <b className="text-foreground">{stats.total.toLocaleString()}건</b>
                으로 집계되며, 그중 <b className="text-foreground">주거용이 {stats.residentialPct}%</b>입니다.{' '}
                <Link href="/special-act" className="font-semibold text-primary underline underline-offset-4 hover:opacity-80">
                  특별조치법
                </Link>{' '}
                한시 기간(~2028.6.16) 안에 양성화를 검토할 수 있습니다.
              </p>
              <Link
                href="/?address=open"
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-extrabold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
              >
                <Search className="h-5 w-5" aria-hidden />
                내 집도 위반인지 30초 진단
              </Link>
            </div>
            <div className="mx-auto w-full max-w-xs shrink-0 lg:mx-0 lg:w-72">
              <DistrictMap name={region} className="h-auto w-full drop-shadow-sm" />
              <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
                서울특별시 {region}
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl space-y-10 px-6 py-12">
          {/* 통계 카드 */}
          <section aria-label={`${region} 위반건축물 통계`} className="grid gap-4 sm:grid-cols-3">
            <Stat label="등재 위반건축물" value={`${stats.total.toLocaleString()}건`} />
            <Stat label="주거용 비중" value={`${stats.residentialPct}%`} />
            <Stat label="신청 마감" value="2028.6.16" sub="특별조치법 한시" />
          </section>

          {/* 유형 분포 */}
          <section aria-label={`${region} 위반 유형 분포`}>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Building2 className="h-5 w-5 text-primary" aria-hidden />
              {region}에서 많은 위반 유형
            </h2>
            <div className="mt-4 space-y-3">
              {stats.uses.map(u => {
                const pct = Math.round((u.count / stats.total) * 100);
                return (
                  <div key={u.name}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold text-foreground">{u.name}</span>
                      <span className="text-muted-foreground">
                        {u.count.toLocaleString()}건 · {pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 동별 분포 */}
          <section aria-label={`${region} 동별 분포`}>
            <h2 className="text-xl font-bold text-foreground">{region}에서 위반건축물이 많은 동</h2>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {stats.dongs.map(dng => (
                <span
                  key={dng.name}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
                >
                  <span className="font-semibold text-foreground">{dng.name}</span>
                  <span className="text-muted-foreground">{dng.count.toLocaleString()}건</span>
                </span>
              ))}
            </div>
          </section>

          {/* 절차 / 이행강제금 */}
          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-card-foreground">{region} 양성화 절차</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                무료상담 → 신고서 작성 → 현장조사 → 건축위원회 심의(1~2개월) → 건축물대장 등재 → 사용승인. 전체 약
                2~3개월. 한시법 기간을 고려하면 지금 준비를 시작해야 안전합니다.
              </p>
            </article>
            <article className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-card-foreground">이행강제금 주의</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                위반 표시는 시정 시까지 <b className="text-red-600">매년 반복·가중</b> 부과됩니다(전국 평균 건당 약 141만
                원). 매매·대출·상속에서도 불리하게 작용할 수 있습니다.
              </p>
            </article>
          </section>

          {/* 이행강제금 부과 현황 (실데이터) */}
          {penaltyYearly.length > 0 && latestPenalty && (
            <section aria-label={`${region} 이행강제금 부과 현황`}>
              <h2 className="text-xl font-bold text-foreground">{region} 이행강제금 부과 현황</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {region}에서는 {latestPenalty.report_year}년에 이행강제금 약{' '}
                <b className="text-foreground">
                  {latestPenalty.assessment_count.toLocaleString()}건, {formatEokKrw(latestPenalty.assessment_amount_thousand_krw)}
                </b>
                이 부과되었습니다(건당 평균 약{' '}
                <b className="text-foreground">
                  {perCaseManKrw(latestPenalty.assessment_amount_thousand_krw, latestPenalty.assessment_count).toLocaleString()}만 원
                </b>
                ).
              </p>
              <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground">
                      <th className="px-4 py-3">연도</th>
                      <th className="px-4 py-3 text-right">부과 건수</th>
                      <th className="px-4 py-3 text-right">부과 금액</th>
                      <th className="px-4 py-3 text-right">건당 평균</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...penaltyYearly].reverse().map(r => (
                      <tr key={r.report_year} className="border-t border-border">
                        <td className="px-4 py-3 font-semibold text-foreground">{r.report_year}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{r.assessment_count.toLocaleString()}건</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatEokKrw(r.assessment_amount_thousand_krw)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {perCaseManKrw(r.assessment_amount_thousand_krw, r.assessment_count).toLocaleString()}만 원
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-sm">
                <Link href="/enforcement-stats" className="font-semibold text-primary underline-offset-4 hover:underline">
                  서울 전체 이행강제금 통계 보기 →
                </Link>
                <span className="mx-2 text-muted-foreground">·</span>
                <Link href="/calc" className="font-semibold text-primary underline-offset-4 hover:underline">
                  내 이행강제금 계산하기
                </Link>
              </p>
            </section>
          )}

          {/* 상담 CTA */}
          <section className="rounded-2xl border border-border bg-primary/5 p-6 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-primary" aria-hidden />
            <h2 className="mt-3 text-xl font-extrabold text-foreground">{region} 위반건축물, 지금 확인하세요</h2>
            <p className="mt-2 text-sm text-muted-foreground">주소만 넣으면 위반 등재 여부·양성화 가능성을 30초 안에.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/?address=open"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-extrabold text-primary-foreground transition hover:opacity-90"
              >
                내 집 주소로 진단
              </Link>
              <RegionConsultationCta region={region} />
            </div>
          </section>

          <nav className="text-center text-sm">
            <Link href="/region" className="font-semibold text-primary underline-offset-4 hover:underline">
              ← 서울 다른 자치구 위반건축물 현황 보기
            </Link>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
