import type { Metadata } from 'next';
import Link from 'next/link';
import { Noto_Serif_KR } from 'next/font/google';
import { Calculator, Search } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { DdayBadges } from '@/components/special-act/DdayBadges';
import { EligibilityChecklist } from '@/components/special-act/EligibilityChecklist';
import { LawFullText } from '@/components/special-act/LawFullText';
import { TocSidebar } from '@/components/special-act/TocSidebar';
import { SpecialActTimeline } from '@/components/special-act/SpecialActTimeline';
import { SpecialActFaq } from '@/components/special-act/SpecialActFaq';
import { SPECIAL_ACT_FAQS } from '@/lib/constants/special-act';
import './special-act.css';

export const dynamic = 'force-static';

// 이 페이지 전용 명조 디스플레이 서체(관보 × 에디토리얼). CSS 변수로만 노출해
// 본문 서체(sans)는 그대로 두고 디스플레이 요소에만 적용한다.
const notoSerifKr = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['600', '900'],
  variable: '--font-serif-kr',
  display: 'swap',
});

const TITLE = '특정건축물 정리에 관한 특별조치법 해설 — 대상·절차·과태료 총정리 | 양성화.com';
const DESCRIPTION =
  '2026년 12월 17일 시행되는 특정건축물 정리에 관한 특별조치법(양성화 특별법) 완전 해설. 대상 건축물 기준, 제외 구역, 신고 절차, 이행강제금 5회분 과태료, 주차장 특례까지 조문별로 정리했습니다.';
const URL = 'https://www.archlegal.co.kr/special-act';
const OG_IMAGE =
  'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/archlegal-og.png';
const LAW_GO_KR_URL = 'https://www.law.go.kr/법령/특정건축물정리에관한특별조치법';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    type: 'website',
    images: [{ url: OG_IMAGE }],
  },
};

const TOC = [
  { id: 'target', label: '어떤 건물이 대상인가' },
  { id: 'excluded', label: '제외되는 구역' },
  { id: 'report', label: '신고 절차와 서류' },
  { id: 'approval', label: '사용승인 4가지 요건' },
  { id: 'cost', label: '비용: 과태료 5회분' },
  { id: 'parking', label: '주차장 특례' },
  { id: 'timeline', label: '일정 타임라인' },
  { id: 'checklist', label: '대상 여부 체크' },
  { id: 'faq', label: '자주 묻는 질문' },
];

export default function SpecialActPage() {
  const org = {
    '@type': 'Organization',
    name: '인건(仁建) 양성화.com',
    url: 'https://www.archlegal.co.kr',
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: '특정건축물 정리에 관한 특별조치법 해설',
        description: DESCRIPTION,
        datePublished: '2026-07-04',
        dateModified: '2026-07-04',
        author: org,
        publisher: org,
        mainEntityOfPage: URL,
        image: OG_IMAGE,
        isPartOf: { '@id': 'https://www.archlegal.co.kr/#website' },
      },
      {
        '@type': 'Legislation',
        name: '특정건축물 정리에 관한 특별조치법',
        legislationIdentifier: '법률 제21820호',
        legislationDate: '2026-06-16',
        temporalCoverage: '2026-12-17/2028-06-16',
        sameAs: LAW_GO_KR_URL,
      },
      {
        '@type': 'FAQPage',
        mainEntity: SPECIAL_ACT_FAQS.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '양성화.com', item: 'https://www.archlegal.co.kr/' },
          { '@type': 'ListItem', position: 2, name: '특별조치법 해설', item: URL },
        ],
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <main className={`sa-root ${notoSerifKr.variable} min-h-screen bg-background select-text`}>
        {/* ① 히어로 — 잉크 풀블리드 */}
        <section className="sa-hero border-b border-white/5">
          <div className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
            {/* 인장 스탬프 (데스크톱) */}
            <div
              aria-hidden
              className="sa-stamp absolute right-6 top-14 hidden h-24 w-24 flex-col items-center justify-center text-center md:flex lg:right-10 lg:top-16"
            >
              <span className="sa-serif text-lg font-black leading-none tracking-[0.3em]">施行</span>
              <span className="sa-nums mt-2 text-[0.7rem] font-bold tracking-widest">
                2026
              </span>
              <span className="sa-nums text-[0.7rem] font-bold tracking-widest">12·17</span>
            </div>

            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] sa-on-ink-muted">
              법률 제21820호 · 2026.6.16 제정
            </p>
            <h1 className="sa-serif mt-5 max-w-3xl text-[2.1rem] font-black leading-[1.18] tracking-tight sa-on-ink sm:text-[2.9rem] lg:text-[3.5rem]">
              특정건축물 정리에 관한 특별조치법{' '}
              <span className="sa-accent-text">완전 해설</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 sa-on-ink-muted sm:text-lg">
              2026년 시행 위반건축물 양성화 특별법 — 대상·절차·비용을 조문별로 정리했습니다.
            </p>

            <DdayBadges />
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-6">
          {/* ② 인용 요약 박스 — 관보 인용 */}
          <blockquote className="sa-quote sa-paper-panel relative mt-12 overflow-hidden rounded-r-xl border-l-4 border-[color:var(--sa-accent)] px-7 py-8 sm:mt-16 sm:px-10 sm:py-9">
            <span
              className="sa-serif pointer-events-none absolute -top-3 left-4 text-[5rem] leading-none sa-accent-text opacity-25"
              aria-hidden
            >
              &ldquo;
            </span>
            <p className="sa-serif relative text-[0.98rem] font-semibold leading-[1.9] text-foreground sm:text-[1.08rem]">
              「특정건축물 정리에 관한 특별조치법」(법률 제21820호)은 2026년 6월 16일 제정되어{' '}
              <b>2026년 12월 17일 시행</b>되는 <b>18개월 한시법</b>입니다. 2023년 12월 31일 당시 사실상 완공된 주거용
              위반건축물이 대상이며, 유효기간 만료는 <b>2028년 6월 16일</b>입니다. 사용승인을 받으려면 건축법 제80조에
              따라 산정한 이행강제금의 <b>5회분에 해당하는 과태료</b>를 납부해야 합니다(기납부 이행강제금은 차감).
            </p>
            <span
              className="sa-nums mt-5 inline-flex items-center rounded-full border border-border px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-muted-foreground"
              aria-hidden
            >
              법률 제21820호
            </span>
          </blockquote>

          {/* ③ 한눈 요약 — 컬럼 스트립 */}
          <section
            aria-label="한눈 요약"
            className="mt-8 grid grid-cols-2 rounded-2xl border border-border sa-paper-panel py-2 lg:grid-cols-4"
          >
            <SummaryCol idx={0} label="대상" sub="2023.12.31 이전 완공">
              주거용 위반건축물
            </SummaryCol>
            <SummaryCol idx={1} label="기간" sub="2026.12.17~2028.6.16">
              18개월 한시
            </SummaryCol>
            <SummaryCol idx={2} label="비용" sub="기납부액 차감">
              이행강제금 <span className="sa-accent-text">5회분</span> 과태료
            </SummaryCol>
            <SummaryCol idx={3} label="혜택" sub="이행강제금 부과 중단">
              사용승인·대장 등재
            </SummaryCol>
          </section>

          {/* ④ 스티키 목차 + 본문 2컬럼 */}
          <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[210px_1fr] lg:gap-16">
            <aside>
              <TocSidebar items={TOC} />
            </aside>

            <div className="min-w-0 space-y-16 sm:space-y-20">
              {/* ⑤ 대상 건축물 */}
              <section id="target" className="sa-chapter scroll-mt-24">
                <ChapterHeading n="01">어떤 건물이 대상인가 (제2조·제3조)</ChapterHeading>
                <Prose>
                  이 법이 말하는 <b className="font-semibold text-foreground">특정건축물</b>은 세 가지 유형입니다(제2조 제1항 제1호).
                  ① 건축허가·신고 없이 건축하거나 대수선한 무허가·무신고 건축물(가목), ② 허가·신고는 했지만 사용승인을 받지
                  못한 건축물(나목), ③ 용도변경 허가·신고 없이 용도를 바꾼 건축물(다목)입니다. 이 중에서도 이 법의 대상은{' '}
                  <b className="font-semibold text-foreground">연면적의 50% 이상이 주거용</b>인 &lsquo;주거용 특정건축물&rsquo;로 한정되며(제2조 제1항
                  제2호), <b className="font-semibold text-foreground">2023년 12월 31일 당시 사실상 완공</b>된 건물이어야 합니다(제3조
                  제1항). 아래 면적 기준을 함께 충족해야 합니다.
                </Prose>

                <SaTable
                  head={['유형', '면적 기준', '근거']}
                  rows={[
                    ['다세대주택', '세대당 전용면적 85㎡ 이하', '제3조 제1항 제1호'],
                    ['단독주택', '연면적 165㎡ 이하 (조례로 165~330㎡ 확장 가능)', '제3조 제1항 제2호 가목'],
                    ['다가구주택', '연면적 660㎡ 이하', '제3조 제1항 제2호 나목'],
                  ]}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  면적을 계산할 때는 증축·대수선한 부분 중 사용승인을 받지 못한 부분도 포함해 산정합니다(제3조 제1항).
                </p>

                <h3 className="sa-serif mt-8 text-base font-bold text-foreground">근린생활시설을 주택으로 쓰는 경우</h3>
                <Prose className="mt-2">
                  위 다세대·단독주택 기준에 해당하는 건축물 중, 근린생활시설로 허가를 받고 사실상 주택으로 사용한
                  건축물도 대상에 포함됩니다(제3조 제1항 제3호). 단, <b className="font-semibold text-foreground">2023년 12월 31일
                  이전부터 주택으로 사용</b>된 경우에 한정됩니다(같은 호 단서). 이 유형은 사용승인 시 건축법
                  제49조·제50조·제52조와 소방시설 기준을 준수해야 하고(제6조 제1항 제3호), 주차장 특례에서도 예외가
                  적용됩니다(제7조 제1항 단서).
                </Prose>
              </section>

              {/* ⑥ 제외 구역 */}
              <section id="excluded" className="sa-chapter scroll-mt-24">
                <ChapterHeading n="02">대상에서 제외되는 구역 (제3조 제2항)</ChapterHeading>
                <Prose>
                  면적·완공 기준을 충족해도 다음 구역·부지·보전산지에 있는 건축물은 원칙적으로 제외됩니다(제3조 제2항).
                  다만 상당수 항목에 <b className="font-semibold text-foreground">단서 예외</b>가 있어, 구역 지정 시점이나 사업 지장
                  여부에 따라 적용될 수 있습니다.
                </Prose>
                <SaTable
                  head={['제외 구역', '단서 예외']}
                  rows={[
                    ['도시·군계획시설 부지 (1호)', '없음'],
                    ['개발제한구역 (2호)', '구역 지정 전 건축·대수선한 경우 적용'],
                    ['군사기지·군사시설 보호구역 (3호)', '지정 전 건축 또는 관할부대장 건의로 국방부장관이 적용 결정한 경우'],
                    ['접도구역 (4호)', '없음'],
                    ['도시개발구역 (5호)', '해당 도시개발사업에 지장이 없는 경우 적용'],
                    ['정비구역 (6호)', '해당 정비사업에 지장이 없는 경우 적용'],
                    ['보전산지 (7호)', '없음'],
                    ['상습재해구역·환경정비구역 (8호)', '대통령령으로 지정'],
                  ]}
                />
                <p className="mt-3 max-w-[68ch] text-sm leading-7 text-muted-foreground">
                  또한 과거 폐지된 「준공미필기존건축물정리에관한특별조치법」이나 이전 특별조치법으로 이미 사용승인을 받고,
                  그 이후 소유권 변동이 없는 건축물도 이 법의 대상이 아닙니다(제3조 제3항).
                </p>
              </section>

              {/* ⑦ 신고 절차 */}
              <section id="report" className="sa-chapter scroll-mt-24">
                <ChapterHeading n="03">신고 절차와 필요 서류 (제4조)</ChapterHeading>
                <Prose>
                  대상건축물의 건축주 또는 소유자는 대통령령으로 정하는 기간 내에{' '}
                  <b className="font-semibold text-foreground">건축사가 작성한 설계도서와 현장조사서</b>를 첨부하여, 관할{' '}
                  시장·군수·구청장(특별자치시장·특별자치도지사 포함)에게 신고해야 합니다(제4조 제1항). 설계도서와
                  현장조사서는 건축사가 작성하는 서류이므로 <b className="font-semibold text-foreground">건축사 협업이 사실상 필수</b>
                  입니다. 국가시책사업으로 건축·대수선한 경우에는 지자체가 작성한 현장조사서로 신고를 갈음할 수 있습니다
                  (같은 항 단서). 서식·내용 등 구체적 사항은 시행령에서 정합니다(제4조 제2항).
                </Prose>
                <InlineCta text="설계도서·현장조사서 준비가 막막하다면, 건축사 협업 기반으로 무료 상담부터 받아보세요." />
              </section>

              {/* ⑧ 사용승인 요건 */}
              <section id="approval" className="sa-chapter scroll-mt-24">
                <ChapterHeading n="04">사용승인의 4가지 요건 (제6조)</ChapterHeading>
                <Prose>
                  지자체는 신고받은 건축물이 아래 요건에 적합하면, 신고받은 날부터{' '}
                  <b className="font-semibold text-foreground">30일 내에 건축위원회 심의</b>를 거쳐 사용승인서를 내주어야 합니다(제6조
                  제1항).
                </Prose>
                <ol className="mt-6 space-y-4">
                  {[
                    ['자기 소유 대지', '자기 소유 대지 또는 사용 승낙을 받은 타인 대지·처분 제한 없는 국공유지에 건축한 건축물일 것(제1호).'],
                    ['건축법 핵심 규정 미위반', '건축법 제44·46·47조를 위반하지 않을 것. 이때 도로 최소너비는 4m가 아니라 3m로 완화 적용되며, 구조안전·위생·방화·일조권에 현저한 지장이 없어야 합니다(제2호).'],
                    ['구조·안전 기준 준수', '세대·가구·호수를 늘리는 대수선을 했거나 근생→주택 전환 건물이라면 건축법 제49·50·52조와 소방시설 기준을 준수할 것(제3호).'],
                    ['과태료·이행강제금 체납 없음', '과태료·이행강제금 체납이 없을 것. 단, 1년 이내에 모두 납부하는 조건으로 사용승인서를 내줄 수 있습니다(제4호).'],
                  ].map(([t, d], i) => (
                    <li key={i} className="flex gap-4 border-b border-border pb-4 last:border-0">
                      <span className="sa-serif sa-nums shrink-0 text-2xl font-black leading-none tabular-nums text-[color:var(--sa-accent)]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* ⑨ 비용 — 쇼피스 다크 패널 */}
              <section id="cost" className="sa-chapter scroll-mt-24">
                <span className="sa-ghost-num" aria-hidden>
                  05
                </span>
                <div className="relative sa-ink-panel overflow-hidden rounded-2xl">
                  <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_20rem] lg:gap-12">
                    <div className="min-w-0">
                      <h2 className="sa-serif text-2xl font-bold leading-snug sa-on-ink sm:text-[1.75rem]">
                        비용의 핵심: 이행강제금 5회분 과태료 (제9조)
                      </h2>
                      <p className="mt-4 text-sm leading-7 sa-on-ink-muted sm:text-base">
                        사용승인을 받으려면 건축법 제80조에 따라 산정한{' '}
                        <b className="font-semibold sa-on-ink">이행강제금의 5회분에 해당하는 과태료</b>를 납부해야 합니다(제9조 제1항).
                        이행강제금이 한 번도 부과된 적이 없어도 5회분이 부과되고, 5회 미만으로 이미 낸 이력이 있으면{' '}
                        <b className="font-semibold sa-on-ink">이미 납부한 금액을 차감</b>한 차액이 부과됩니다(제9조 제2항).
                      </p>
                      <p className="mt-4 text-sm leading-7 sa-on-ink-muted">
                        한편 「전세사기피해자 지원 및 주거안정에 관한 특별법」에 따라 전세사기피해자가 전세사기피해주택을 매수한
                        경우에는 이 과태료를 부과하지 않습니다(제9조 제1항 단서).
                      </p>
                      <Link
                        href="/calc"
                        className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[color:var(--sa-on-ink)] px-6 text-base font-extrabold text-[color:var(--sa-ink)] transition hover:opacity-90"
                      >
                        <Calculator className="h-5 w-5 text-[color:var(--sa-accent)]" aria-hidden />
                        내 이행강제금 계산해 보기
                      </Link>
                    </div>

                    {/* 고지서 카드 */}
                    <figure className="sa-paper-panel rounded-xl p-6 text-foreground">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        계산 예시 (가정)
                      </p>
                      <div className="sa-perf mt-4 space-y-2.5 pt-4">
                        <ReceiptRow label="이행강제금 1회분" value="3,000,000원" />
                        <ReceiptRow label="× 5회분" value="15,000,000원" />
                        <ReceiptRow label="기납부 이행강제금" value="−6,000,000원" />
                        <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
                          <span className="text-sm font-semibold text-foreground">부과 과태료</span>
                          <span className="sa-serif sa-nums text-2xl font-black tabular-nums text-[color:var(--sa-alert)]">
                            9,000,000원
                          </span>
                        </div>
                      </div>
                      <figcaption className="mt-4 text-xs leading-6 text-muted-foreground">
                        이행강제금 1회분을 300만 원으로 가정하면, 5회분 과태료는 1,500만 원입니다. 만약 과거에 이미
                        2회분(600만 원)을 납부했다면, 차감 후 900만 원이 부과됩니다. 실제 1회분 금액은 건물의 위반
                        면적·시가표준액 등에 따라 달라지므로, 정확한 금액은 개별 산정이 필요합니다.
                      </figcaption>
                    </figure>
                  </div>
                </div>
              </section>

              {/* ⑩ 주차장 특례 */}
              <section id="parking" className="sa-chapter scroll-mt-24">
                <ChapterHeading n="06">주차장 특례 (제7조)</ChapterHeading>
                <Prose>
                  이 법에 따른 사용승인으로 「주차장법」 제19조의 부설주차장 설치기준에 미달하게 되더라도, 원칙적으로{' '}
                  <b className="font-semibold text-foreground">추가 주차장 설치 의무가 없습니다</b>(제7조 제1항). 다만{' '}
                  세대·가구·호수를 증가시키는 대수선을 한 건축물이거나 근린생활시설을 주택으로 전환한 경우(제3조 제1항
                  제3호)에는 예외로, 부설주차장을 설치하거나 그 설치 비용을 납부해야 합니다(제7조 제1항 단서). 전세사기피해자가
                  매수한 전세사기피해주택은 이 예외에서도 제외되어 추가 설치 의무가 없으며(제7조 제2항), 지자체는 지역
                  여건을 고려해 조례로 설치의무를 완화·면제할 수 있습니다(제7조 제3항).
                </Prose>
              </section>

              {/* ⑪ 타임라인 */}
              <section id="timeline" className="sa-chapter scroll-mt-24">
                <ChapterHeading n="07">일정 타임라인 (부칙)</ChapterHeading>
                <SpecialActTimeline />
                <div className="mt-6 rounded-xl sa-paper-panel border-l-4 border-[color:var(--sa-alert)] px-5 py-4">
                  <p className="text-sm leading-6 text-foreground">
                    건축위원회 심의 등 절차 기간을 고려하면 실질적인 준비 시한은 만료일보다 더 짧습니다. 여유 있게 미리
                    준비를 시작하는 것이 안전합니다.
                  </p>
                </div>
              </section>

              {/* ⑫ 체크리스트 */}
              <section id="checklist" className="sa-chapter scroll-mt-24">
                <ChapterHeading n="08">우리 집은 대상일까? 30초 체크</ChapterHeading>
                <Prose>
                  아래 항목을 체크하면 대상 가능성을 대략 확인할 수 있습니다. 참고용 안내이며, 최종 판단은 서류 검토와 상담이
                  필요합니다.
                </Prose>
                <div className="mt-6">
                  <EligibilityChecklist />
                </div>
              </section>

              {/* ⑬ FAQ */}
              <section id="faq" className="sa-chapter scroll-mt-24">
                <ChapterHeading n="09">자주 묻는 질문</ChapterHeading>
                <div className="mt-6">
                  <SpecialActFaq items={SPECIAL_ACT_FAQS} />
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* ⑭ 최종 CTA — 잉크 밴드 */}
        <section className="sa-ink-panel mt-16 sm:mt-20">
          <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
            <h2 className="sa-serif text-2xl font-bold sa-on-ink sm:text-3xl">
              내 집이 대상인지, 지금 확인하세요
            </h2>
            <p className="mt-3 text-sm sa-on-ink-muted sm:text-base">
              주소만 넣으면 위반 등재 여부·양성화 가능성을 확인할 수 있습니다.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/?address=open"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[color:var(--sa-on-ink)] px-6 text-base font-extrabold text-[color:var(--sa-ink)] transition hover:opacity-90"
              >
                <Search className="h-5 w-5 text-[color:var(--sa-accent)]" aria-hidden />
                내 집 주소로 진단
              </Link>
              <Link
                href="/check"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 text-base font-bold sa-on-ink transition hover:bg-white/10"
              >
                1분 자가진단
              </Link>
              <Link
                href="/calc"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 px-6 text-base font-bold sa-on-ink transition hover:bg-white/10"
              >
                <Calculator className="h-5 w-5" aria-hidden />
                이행강제금 계산
              </Link>
            </div>
            <p className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
              <Link href="/region" className="font-semibold sa-on-ink underline-offset-4 hover:underline">
                지역별 위반건축물 현황 보기 →
              </Link>
              <Link href="/guide" className="font-semibold sa-on-ink underline-offset-4 hover:underline">
                더 알아보기: 양성화 가이드 →
              </Link>
            </p>
          </div>
        </section>

        {/* ⑮ 원문 전문 + 신뢰 푸터 */}
        <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-14">
          <LawFullText />
          <div className="border-t border-border pt-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              최종 검토일: 2026년 7월 4일 · 인건(仁建) 위반건축물 양성화 전문팀 검토
            </p>
            <p className="mt-2 leading-6">
              본 해설은 일반적인 법령 안내이며 개별 사안의 법률 자문을 대신하지 않습니다. 구체적 판단은 관할 지자체 및
              전문가 상담을 통해 확인하세요.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function ChapterHeading({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="relative pt-4">
      <span className="sa-ghost-num" aria-hidden>
        {n}
      </span>
      <h2 className="sa-serif relative z-[1] text-2xl font-bold leading-snug text-foreground sm:text-[1.75rem]">
        {children}
      </h2>
    </div>
  );
}

function Prose({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mt-4 max-w-[68ch] text-sm leading-7 text-muted-foreground sm:text-base ${className}`}>
      {children}
    </p>
  );
}

function SummaryCol({
  idx,
  label,
  sub,
  children,
}: {
  idx: number;
  label: string;
  sub: string;
  children: React.ReactNode;
}) {
  // 헤어라인 디바이더: 모바일 2×2(세로+가로), 데스크톱 4열(세로).
  const cls = [
    'px-5 py-5 sm:px-6',
    idx % 2 === 1 ? 'border-l border-border' : '', // 모바일 우측 열
    idx >= 2 ? 'border-t border-border lg:border-t-0' : '', // 모바일 둘째 줄
    idx === 2 ? 'lg:border-l lg:border-border' : '', // 데스크톱 세로 디바이더 복원
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="sa-serif mt-1.5 text-[1.4rem] font-bold leading-tight text-foreground">
        {children}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function SaTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="sa-paper-panel text-left">
            {head.map(h => (
              <th
                key={h}
                className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-foreground">
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-border">
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-3.5 align-top ${
                    ci === 0 ? 'font-medium' : ci === r.length - 1 ? 'text-muted-foreground' : ''
                  }`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="sa-nums text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function InlineCta({ text }: { text: string }) {
  return (
    <div className="mt-6 flex flex-col items-start gap-3 rounded-xl sa-paper-panel border-l-4 border-[color:var(--sa-accent)] p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-6 text-foreground">{text}</p>
      <Link
        href="/?address=open"
        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
      >
        무료 상담 신청
      </Link>
    </div>
  );
}
