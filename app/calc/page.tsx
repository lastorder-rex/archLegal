import type { Metadata } from 'next';
import Link from 'next/link';
import { EnforcementFineCalculatorClient } from '@/components/enforcement-fine/EnforcementFineCalculatorClient';

export const revalidate = 0;

export const metadata: Metadata = {
  title: '이행강제금 계산 | 양성화.com - 인건(仁建)',
  description:
    '주소와 위반면적을 기준으로 위반건축물 이행강제금을 추정 계산합니다. 시가표준액 산정 방식, 부과 절차, 양성화 절차까지 한 번에 확인하세요.',
  alternates: {
    canonical: 'https://www.archlegal.co.kr/calc'
  },
  openGraph: {
    title: '이행강제금 계산 | 양성화.com - 인건(仁建)',
    description: '주소와 위반면적을 기준으로 위반건축물 이행강제금을 추정 계산합니다.',
    url: 'https://www.archlegal.co.kr/calc',
    type: 'website',
    images: [
      {
        url: 'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/kakao_c.png'
      }
    ]
  }
};

const faqItems = [
  {
    question: '이행강제금은 매년 내야 하나요?',
    answer:
      '이행강제금은 시정명령이 이행될 때까지 1년에 1회에 한하여 반복하여 부과·징수될 수 있습니다. 위반 상태를 해소하거나 양성화(사용승인)를 완료하면 더 이상 부과되지 않습니다.'
  },
  {
    question: '양성화하면 이행강제금이 없어지나요?',
    answer:
      '위반건축물 양성화 절차는 일반적으로 행정처분 요청서 제출, 시가표준액 의뢰, 이행강제금 부과·납부(1회분), 허가·신고 등 행정절차 이행, 사용승인 순으로 진행됩니다. 즉 기존에 부과된 1회분은 납부해야 하지만, 사용승인을 받아 양성화가 완료되면 이후 반복 부과가 중단됩니다.'
  },
  {
    question: '이 계산기의 결과는 실제 부과액과 동일한가요?',
    answer:
      '아닙니다. 본 계산기는 공시 기준에 따른 추정치를 제공합니다. 부과요율과 감경률·가중률은 건축법과 각 지방자치단체의 건축조례로 정해지며, 구조지수·용도지수·위치지수·경과연수별잔가율 등 세부 산정 요소에 따라 실제 부과액과 차이가 발생할 수 있습니다.'
  },
  {
    question: '시가표준액은 시세(시가)와 같은 건가요?',
    answer:
      '아닙니다. 시가표준액은 시가 그 자체가 아니라 취득세·재산세 등 지방세 세목별 과세표준액의 기준이 되는 적정가액으로, 지방자치단체의 장이 결정·고시합니다.'
  }
];

const standardPriceRows = [
  { use: '주거용 건물', price: '860,000원/㎡' },
  { use: '상업용 건물', price: '860,000원/㎡' },
  { use: '공업용 건물', price: '840,000원/㎡' },
  { use: '농수산용 건물', price: '640,000원/㎡' },
  { use: '문화·복지·교육용 건물', price: '860,000원/㎡' },
  { use: '공공용 건물', price: '850,000원/㎡' }
];

export default function CalcPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://www.archlegal.co.kr/calc#webpage',
        url: 'https://www.archlegal.co.kr/calc',
        name: '이행강제금 계산',
        description: '주소와 위반면적을 기준으로 위반건축물 이행강제금을 추정 계산하는 페이지입니다.',
        isPartOf: {
          '@id': 'https://www.archlegal.co.kr/#website'
        }
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://www.archlegal.co.kr/calc#calculator',
        name: '이행강제금 계산기',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        url: 'https://www.archlegal.co.kr/calc'
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://www.archlegal.co.kr/calc#faq',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer
          }
        }))
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://www.archlegal.co.kr/calc#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: '양성화.com',
            item: 'https://www.archlegal.co.kr/'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '이행강제금 계산',
            item: 'https://www.archlegal.co.kr/calc'
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <EnforcementFineCalculatorClient />
      <section className="bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-12 sm:px-6 lg:px-8">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">이행강제금이란?</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              이행강제금은 위반건축물에 대한 시정명령을 받은 후 시정기간 내에 이를 이행하지 않은 건축주
              등에게 부과되는 금전적 제재 조치입니다. 시정명령이 이행될 때까지 1년에 1회에 한하여
              반복하여 부과될 수 있습니다.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              위반건축물은 통상 다음 절차로 처리됩니다.
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <li>위반건축물 현장조사</li>
              <li>시정명령 사전통지(처분 전 의견청취)</li>
              <li>시정명령 및 건축물대장에 &lsquo;위반건축물&rsquo; 표시(위반내용 기재)</li>
              <li>시정명령 촉구 및 이행강제금 부과 사전통지</li>
              <li>이행강제금 부과(매년 1회 반복 부과)</li>
            </ol>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              시정명령을 이행하지 않으면 다른 법령에 따른 영업 등의 허가·면허·인가·등록이 제한될 수
              있고, 이행강제금을 납부하지 않으면 재산 압류 등 체납처분이 진행될 수 있습니다.
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">이행강제금 계산 방법</h2>
            <p className="mt-3 rounded-md bg-slate-100 px-4 py-3 text-sm font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              이행강제금 = 시가표준액 × 위반면적 × 부과요율 × 감경률 또는 가중률
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              시가표준액은 취득세·재산세 등 지방세 과세표준액의 기준이 되는 가액으로, 지방자치단체의
              장이 결정·고시합니다. 오피스텔 외 일반 건축물의 시가표준액은 건물신축가격기준액에
              구조지수·용도지수·위치지수·경과연수별잔가율·면적·가감산율을 곱하여 산정합니다.
              부과요율과 감경률·가중률은 건축법과 각 지방자치단체의 건축조례로 정하므로 지역과 위반
              유형에 따라 달라집니다.
            </p>
            <h3 className="mt-4 text-sm font-semibold">
              2026년 건물신축가격기준액 (행정안전부고시 제2025-82호)
            </h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[320px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2 pr-4 font-medium">구분</th>
                    <th className="py-2 font-medium">건물신축가격기준액</th>
                  </tr>
                </thead>
                <tbody>
                  {standardPriceRows.map((row) => (
                    <tr
                      key={row.use}
                      className="border-b border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                    >
                      <td className="py-2 pr-4">{row.use}</td>
                      <td className="py-2">{row.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">위반건축물 양성화 절차</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              위반건축물 행정처분 요청서 제출 → 시가표준액 의뢰 → 이행강제금 부과·납부(1회분) →
              허가·신고 등 행정절차 이행 → 사용승인(양성화) 순으로 진행됩니다. 내 건축물이 양성화
              대상이 되는지는{' '}
              <Link href="/check" className="font-medium text-primary underline underline-offset-2">
                1분 양성화 자가진단
              </Link>
              에서 간단히 확인할 수 있습니다.
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">자주 묻는 질문</h2>
            <dl className="mt-3 space-y-4">
              {faqItems.map((item) => (
                <div key={item.question}>
                  <dt className="text-sm font-semibold">{item.question}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </article>

          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            출처: 2026년 건물신축가격기준액 고시(행정안전부고시 제2025-82호), 지방세 시가표준액
            조사·산정 기준(행정안전부훈령 제417호). 본 안내는 일반적인 정보 제공을 위한 것으로 법적
            자문이 아니며, 실제 부과 기준은 관할 지방자치단체의 건축조례에 따라 다를 수 있습니다.
          </p>
        </div>
      </section>
    </>
  );
}
