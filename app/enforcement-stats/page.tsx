import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Calculator, MapPin, Scale, TrendingDown } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import {
  getSeoulYearlyTotals,
  getSeoulTypeBreakdown,
  getDistrictRanking,
  formatEokKrw,
  perCaseManKrw,
  collectionRatePct,
} from '@/lib/stats/enforcement-penalty';

export const revalidate = 86400;

const URL = 'https://www.archlegal.co.kr/enforcement-stats';

export const metadata: Metadata = {
  title: '서울 이행강제금 부과 현황 통계(2021~2025) — 자치구·위반유형별 | 양성화.com',
  description:
    '서울시 이행강제금 부과 통계를 연도별·자치구별·위반유형별로 정리했습니다. 최근 5년 부과 건수·금액, 건당 평균, 무단 용도변경이 가장 무거운 이유까지 실데이터로 확인하세요.',
  alternates: { canonical: URL },
  openGraph: {
    title: '서울 이행강제금 부과 현황 통계(2021~2025) | 양성화.com',
    description:
      '서울시 이행강제금 최근 5년 부과 건수·금액, 자치구 순위, 위반유형별 건당 평균을 실데이터로 정리했습니다.',
    url: URL,
    type: 'website',
  },
};

export default async function EnforcementStatsPage() {
  const yearly = await getSeoulYearlyTotals();
  if (yearly.length === 0) {
    // 데이터 미적재 시 페이지 자체를 비우지 않고 최소 안내만 (실운영에선 발생하지 않음)
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-6 py-20 text-muted-foreground">통계 데이터를 준비 중입니다.</main>
        <SiteFooter />
      </>
    );
  }

  const latest = yearly[yearly.length - 1];
  const firstYear = yearly[0].report_year;
  const lastYear = latest.report_year;
  const totalCount = yearly.reduce((s, r) => s + r.assessment_count, 0);
  const totalAmount = yearly.reduce((s, r) => s + r.assessment_amount_thousand_krw, 0);
  const latestPerCase = perCaseManKrw(latest.assessment_amount_thousand_krw, latest.assessment_count);

  const types = await getSeoulTypeBreakdown(lastYear);
  const heaviest = [...types].sort(
    (a, b) => perCaseManKrw(b.assessment_amount_thousand_krw, b.assessment_count) - perCaseManKrw(a.assessment_amount_thousand_krw, a.assessment_count)
  )[0];

  const ranking = await getDistrictRanking(lastYear);
  const maxDistrictCount = ranking[0]?.assessment_count ?? 1;
  const maxYearAmount = Math.max(...yearly.map(r => r.assessment_amount_thousand_krw));
  const maxTypePerCase = Math.max(...types.map(t => perCaseManKrw(t.assessment_amount_thousand_krw, t.assessment_count)));

  const faqs = [
    {
      q: '서울에서 이행강제금은 한 해 얼마나 부과되나요?',
      a: `${lastYear}년 기준 서울특별시의 이행강제금 부과는 약 ${latest.assessment_count.toLocaleString()}건, ${formatEokKrw(latest.assessment_amount_thousand_krw)} 규모입니다. ${firstYear}~${lastYear}년 5개년 누적으로는 약 ${totalCount.toLocaleString()}건, ${formatEokKrw(totalAmount)}이 부과되었습니다.`,
    },
    {
      q: '이행강제금은 건당 평균 얼마인가요?',
      a: `${lastYear}년 서울 기준 건당 평균 약 ${latestPerCase.toLocaleString()}만 원입니다. 다만 위반 유형에 따라 차이가 커서, ${heaviest.violation_type_name}은 건당 평균 약 ${perCaseManKrw(heaviest.assessment_amount_thousand_krw, heaviest.assessment_count).toLocaleString()}만 원으로 가장 무겁습니다.`,
    },
    {
      q: '어떤 위반 유형의 이행강제금이 가장 무겁나요?',
      a: `${lastYear}년 서울 기준 건당 평균이 가장 높은 유형은 ${heaviest.violation_type_name}(약 ${perCaseManKrw(heaviest.assessment_amount_thousand_krw, heaviest.assessment_count).toLocaleString()}만 원)입니다. 건수 기준으로는 무허가·무신고 건축이 전체의 대부분을 차지합니다.`,
    },
    {
      q: '이행강제금은 한 번만 내면 끝나나요?',
      a: '아닙니다. 건축법 제80조에 따라 위반사항이 시정될 때까지 매년 반복 부과될 수 있으며, 장기 미시정 시 가중될 수 있습니다. 특정건축물 정리에 관한 특별조치법(2026.12.17 시행)에 따라 사용승인을 받으면 반복 부과에서 벗어날 수 있으나, 과태료(이행강제금 5회분, 기납부액 차감)와 체납이 없을 것 등의 요건이 있습니다.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Dataset',
        name: `서울특별시 이행강제금 부과 현황 통계 (${firstYear}~${lastYear})`,
        description:
          '서울특별시 및 25개 자치구의 위반건축물 이행강제금 부과·징수 현황을 연도별·위반유형별로 집계한 데이터입니다.',
        url: URL,
        temporalCoverage: `${firstYear}-01-01/${lastYear}-12-31`,
        spatialCoverage: '대한민국 서울특별시',
        variableMeasured: ['이행강제금 부과 건수', '이행강제금 부과 금액', '이행강제금 징수 건수', '이행강제금 징수 금액'],
        creator: { '@id': 'https://www.archlegal.co.kr/#organization' },
        isPartOf: { '@id': 'https://www.archlegal.co.kr/#website' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '양성화.com', item: 'https://www.archlegal.co.kr/' },
          { '@type': 'ListItem', position: 2, name: '이행강제금 통계', item: URL },
        ],
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen bg-background">
        {/* 히어로 */}
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden />
              서울특별시 · {firstYear}~{lastYear} 실데이터
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              서울 이행강제금 부과 현황 통계
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              서울특별시에서는 {firstYear}~{lastYear}년 5년간 위반건축물에 약{' '}
              <b className="text-foreground">{totalCount.toLocaleString()}건, {formatEokKrw(totalAmount)}</b>의
              이행강제금이 부과되었습니다. {lastYear}년 기준 건당 평균은 약{' '}
              <b className="text-foreground">{latestPerCase.toLocaleString()}만 원</b>이며, 위반이 시정될 때까지{' '}
              <b className="text-red-600">매년 반복 부과</b>될 수 있습니다.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl space-y-12 px-6 py-12">
          {/* KPI 타일 */}
          <section aria-label="핵심 지표" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={`5년 누적 부과 건수`} value={`${(totalCount / 10000).toFixed(1)}만 건`} sub={`${firstYear}~${lastYear} 서울 전체`} />
            <Stat label="5년 누적 부과 금액" value={formatEokKrw(totalAmount)} sub="부과 기준" />
            <Stat label={`${lastYear}년 건당 평균`} value={`${latestPerCase.toLocaleString()}만 원`} sub="부과금액 ÷ 부과건수" />
            <Stat
              label="건당 평균 최고 유형"
              value={`${perCaseManKrw(heaviest.assessment_amount_thousand_krw, heaviest.assessment_count).toLocaleString()}만 원`}
              sub={heaviest.violation_type_name}
            />
          </section>

          {/* 연도별 추이 */}
          <section aria-label="연도별 부과 추이">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <TrendingDown className="h-5 w-5 text-primary" aria-hidden />
              연도별 부과 추이 (서울 전체)
            </h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">연도</th>
                    <th className="px-4 py-3 text-right">부과 건수</th>
                    <th className="px-4 py-3 text-right">부과 금액</th>
                    <th className="w-1/3 px-4 py-3">금액 규모</th>
                    <th className="px-4 py-3 text-right">건당 평균</th>
                    <th className="px-4 py-3 text-right">징수율*</th>
                  </tr>
                </thead>
                <tbody>
                  {[...yearly].reverse().map(r => {
                    const pct = Math.round((r.assessment_amount_thousand_krw / maxYearAmount) * 100);
                    return (
                      <tr key={r.report_year} className="border-t border-border">
                        <td className="px-4 py-3 font-semibold text-foreground">{r.report_year}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{r.assessment_count.toLocaleString()}건</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatEokKrw(r.assessment_amount_thousand_krw)}</td>
                        <td className="px-4 py-3">
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, pct)}%` }} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {perCaseManKrw(r.assessment_amount_thousand_krw, r.assessment_count).toLocaleString()}만 원
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{collectionRatePct(r)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              * 징수율 = 해당 연도 부과금액 대비 징수금액 비율. 연도 말 부과분은 이듬해 징수되는 경우가 있어 최근 연도일수록
              낮게 보일 수 있습니다.
            </p>
          </section>

          {/* 유형별 건당 평균 */}
          <section aria-label="위반유형별 건당 평균">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Scale className="h-5 w-5 text-primary" aria-hidden />
              위반유형별 건당 평균 부과액 ({lastYear})
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              건수는 무허가·무신고가 압도적이지만, <b className="text-foreground">건당 금액은 {heaviest.violation_type_name}이 가장
              무겁습니다</b>. 용도변경은 위반 면적이 넓고 시가표준액 반영이 커서 건당 부담이 높아지는 구조입니다.
            </p>
            <div className="mt-4 space-y-3">
              {[...types]
                .sort(
                  (a, b) =>
                    perCaseManKrw(b.assessment_amount_thousand_krw, b.assessment_count) -
                    perCaseManKrw(a.assessment_amount_thousand_krw, a.assessment_count)
                )
                .map(t => {
                const perCase = perCaseManKrw(t.assessment_amount_thousand_krw, t.assessment_count);
                const pct = Math.round((perCase / maxTypePerCase) * 100);
                return (
                  <div key={t.violation_type_code}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold text-foreground">{t.violation_type_name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        건당 평균 <b className="text-foreground">{perCase.toLocaleString()}만 원</b> · {t.assessment_count.toLocaleString()}건
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

          {/* 자치구 순위 */}
          <section aria-label="자치구별 부과 순위">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <MapPin className="h-5 w-5 text-primary" aria-hidden />
              자치구별 부과 현황 ({lastYear})
            </h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">순위</th>
                    <th className="px-4 py-3">자치구</th>
                    <th className="px-4 py-3 text-right">부과 건수</th>
                    <th className="w-1/3 px-4 py-3">건수 규모</th>
                    <th className="px-4 py-3 text-right">부과 금액</th>
                    <th className="px-4 py-3 text-right">건당 평균</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r, i) => {
                    const pct = Math.round((r.assessment_count / maxDistrictCount) * 100);
                    return (
                      <tr key={r.region_name} className="border-t border-border">
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/region/${encodeURIComponent(r.region_name)}`}
                            className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
                          >
                            {r.region_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{r.assessment_count.toLocaleString()}건</td>
                        <td className="px-4 py-3">
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, pct)}%` }} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatEokKrw(r.assessment_amount_thousand_krw)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {perCaseManKrw(r.assessment_amount_thousand_krw, r.assessment_count).toLocaleString()}만 원
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              자치구명을 클릭하면 해당 구의 위반건축물 현황·양성화 안내 페이지로 이동합니다.
            </p>
          </section>

          {/* 해석 + 특별조치법 연결 */}
          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-card-foreground">이 숫자가 의미하는 것</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                이행강제금은 한 번 내고 끝나는 벌금이 아니라 <b className="text-red-600">시정될 때까지 매년 반복</b>되는
                부담입니다. 건당 평균 {latestPerCase.toLocaleString()}만 원을 5년 낸다면 산술적으로{' '}
                {(latestPerCase * 5).toLocaleString()}만 원 이상이 됩니다.{' '}
                <Link href="/special-act" className="font-semibold text-primary underline-offset-4 hover:underline">
                  특별조치법
                </Link>
                에 따라 사용승인을 받으면 반복 부과에서 벗어날 수 있습니다.
              </p>
            </article>
            <article className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-card-foreground">양성화 전 체납 확인</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                특별조치법 제6조는 사용승인 요건으로 <b className="text-foreground">과태료·이행강제금 체납이 없을 것</b>을
                요구합니다(1년 내 납부 조건부 예외). 체납이 있다면 양성화 신청 전에 정리 계획부터 세워야 합니다.
              </p>
            </article>
          </section>

          {/* FAQ */}
          <section aria-label="자주 묻는 질문">
            <h2 className="text-xl font-bold text-foreground">자주 묻는 질문</h2>
            <div className="mt-4 space-y-3">
              {faqs.map(f => (
                <details key={f.q} className="rounded-xl border border-border bg-card p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">{f.q}</summary>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-2xl border border-border bg-primary/5 p-6 text-center">
            <Calculator className="mx-auto h-8 w-8 text-primary" aria-hidden />
            <h2 className="mt-3 text-xl font-extrabold text-foreground">내 건물의 이행강제금은 얼마일까요?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              주소와 위반 내용을 넣으면 시가표준액 기준으로 예상 이행강제금을 계산해 드립니다.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/calc"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-extrabold text-primary-foreground transition hover:opacity-90"
              >
                이행강제금 계산기
              </Link>
              <Link
                href="/?address=open"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-primary/40 px-6 text-base font-bold text-primary transition hover:bg-primary/10"
              >
                내 집 주소로 위반 진단
              </Link>
            </div>
          </section>

          {/* 출처·기준 */}
          <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
            집계 기준: 서울특별시 자치구 이행강제금 부과·징수 현황 자료({firstYear}~{lastYear}, 건축법 제80조 기준).
            부과·징수 건수와 금액은 집계 시점에 따라 달라질 수 있으며, 본 통계는 참고용으로 개별 사안의 법률 자문을
            대신하지 않습니다.
          </p>
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
      <p className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
