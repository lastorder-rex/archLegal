import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, FileText, HouseHeart, MessageCircle } from 'lucide-react';
import { SiteFooter } from '@/components/layout/SiteFooter';

export const revalidate = 0;

export const metadata: Metadata = {
  title: '양성화.com 브랜드 캠페인 | 인건(仁建)',
  description:
    '양성화.com 브랜드 캠페인에서 위반건축물, 불법건축물, 옥상 증축, 이행강제금 등 실제 상담 전 자주 묻는 고민을 포스터 콘텐츠로 확인하세요.',
  openGraph: {
    title: '양성화.com 브랜드 캠페인 | 인건(仁建)',
    description: '위반건축물 양성화 고민을 포스터 콘텐츠로 쉽게 확인하고 1분 자가진단으로 현재 상황을 점검하세요.',
    type: 'website',
    images: ['/t1.png']
  },
  alternates: {
    canonical: 'https://www.archlegal.co.kr/campaign'
  }
};

const projects = [
  {
    id: 'project-01',
    image: '/t1.png',
    number: 'PROJECT 01',
    title: '건축물 양성화 우리도 가능?',
    heading: '가능성은 먼저 확인해야 보입니다',
    lead: '위반건축물 문제는 방치보다 현재 상태 확인이 먼저입니다.',
    summary:
      '건축물대장, 위반 내용, 완공 시점, 토지이용계획을 함께 보면 양성화 가능성을 더 현실적으로 판단할 수 있습니다.',
    alt: '건축물 양성화 우리도 가능 문구가 담긴 양성화.com 캠페인 이미지',
    issues: ['건축물대장 위반 표시', '무허가 증축', '사용승인 미취득', '용도변경 검토']
  },
  {
    id: 'project-02',
    image: '/t2.png',
    number: 'PROJECT 02',
    title: '이런 건물이라면 양성화 가능',
    heading: '대상 여부를 기준으로 좁혀갑니다',
    lead: '모든 위반건축물이 가능한 것은 아니지만, 검토할 수 있는 유형은 분명히 있습니다.',
    summary:
      '무허가 건축, 사용승인 미취득, 무단 용도변경 등은 특정건축물 정리 법안에서 먼저 확인해야 할 핵심 유형입니다.',
    alt: '이런 건물이라면 양성화 가능 문구가 담긴 위반건축물 양성화 캠페인 이미지',
    issues: ['무허가·무신고 건축', '사용승인 미취득', '무단 용도변경', '주거용 비율 확인']
  },
  {
    id: 'project-03',
    image: '/t3.png',
    number: 'PROJECT 03',
    title: '옥상 증축도 가능성 있을까?',
    heading: '생활 편의 공간도 기준 확인이 필요합니다',
    lead: '옥상 방, 다락, 창고, 임시 구조물은 생활 편의 목적이어도 위반이 될 수 있습니다.',
    summary:
      '옥상 증축은 면적, 높이, 구조안전, 피난·방화 기준과 연결됩니다. 단순 사진만으로 판단하지 않고 건축사 검토가 필요합니다.',
    alt: '옥상 증축도 가능성 있을까 문구가 담긴 불법증축 양성화 캠페인 이미지',
    issues: ['옥상 무단 증축', '다락 구조 변경', '무허가 창고', '구조안전 확인']
  },
  {
    id: 'project-04',
    image: '/t4.png',
    number: 'PROJECT 04',
    title: '가장 중요한 건 지금 상태',
    heading: '비용보다 먼저 상태를 봅니다',
    lead: '양성화 상담에서 가장 중요한 시작점은 현재 건축물의 사실관계입니다.',
    summary:
      '위반 면적, 건축 시점, 대지 권한, 제외 구역 여부, 이행강제금 체납 여부를 함께 확인해야 다음 판단이 가능합니다.',
    alt: '가장 중요한 건 지금 상태 문구가 담긴 양성화.com 자가진단 캠페인 이미지',
    issues: ['완공 시점', '위반 면적', '대지 권한', '체납 여부']
  },
  {
    id: 'project-05',
    image: '/t5.png',
    number: 'PROJECT 05',
    title: '혼자 판단하지 마세요',
    heading: '건축·행정 기준이 함께 얽혀 있습니다',
    lead: '위반건축물 문제는 검색 결과만으로 결론내리기 어렵습니다.',
    summary:
      '건축법, 소방·피난 기준, 주차장 기준, 지자체 조례, 토지이용계획이 동시에 작동하므로 전문가 검토가 필요한 경우가 많습니다.',
    alt: '혼자 판단하지 마세요 전문가 검토가 필요합니다 문구가 담긴 위반건축물 상담 캠페인 이미지',
    issues: ['건축사 현장조사', '지자체 조례', '소방·피난 기준', '주차장 기준']
  },
  {
    id: 'project-06',
    image: '/t6.png',
    number: 'PROJECT 06',
    title: '우리 건물도 가능할까? 양성화.com',
    heading: '1분 자가진단으로 먼저 점검하세요',
    lead: '상담 전에도 기본 조건을 빠르게 확인할 수 있습니다.',
    summary:
      '양성화.com의 1분 자가진단은 건축물 유형, 완공 시점, 제외 구역, 체납 여부 등 핵심 질문으로 상담 필요성을 좁혀갑니다.',
    alt: '우리 건물도 가능할까 양성화.com 문구가 담긴 1분 양성화 자가진단 캠페인 이미지',
    issues: ['1분 자가진단', '대상 기준 확인', '상담 필요성 판단', '다음 절차 안내']
  }
];

const checks = [
  {
    label: 'CHECK 01',
    title: '왜 문제가 될까?',
    description: '위반건축물 표시는 부동산 거래, 대출, 상속 과정에서 중요한 검토 요소가 될 수 있습니다.'
  },
  {
    label: 'CHECK 02',
    title: '어떤 사례가 많을까?',
    description: '옥상 증축, 무허가 창고, 불법 용도변경, 근린생활시설 주택 사용 관련 문의가 많습니다.'
  },
  {
    label: 'CHECK 03',
    title: '무엇부터 해야 할까?',
    description: '건축물대장과 토지이용계획을 확인하고, 현재 상태와 양성화 가능 여부를 먼저 점검해야 합니다.'
  }
];

export default function CampaignPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground transition hover:text-primary"
          >
            <Image src="/docu/logo.png" alt="" width={28} height={28} aria-hidden="true" />
            <span>양성화.com</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 transition hover:border-primary hover:text-primary"
            >
              <HouseHeart className="h-4 w-4" aria-hidden="true" />
              홈으로 돌아가기
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:py-20">
            <div className="space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Yangseonghwa.com Campaign</p>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                  양성화.com
                  <br />
                  브랜드 캠페인
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  위반건축물 문제를 딱딱한 법률 안내가 아니라, 상담 전 반드시 확인해야 할 현실적인 질문으로 정리한
                  캠페인 콘텐츠입니다.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/check"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                >
                  1분 자가진단
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/request"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary"
                >
                  상담 문의
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[360px]">
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                <Image
                  src="/t6.png"
                  alt="우리 건물도 가능할까 양성화.com 1분 자가진단 캠페인 대표 이미지"
                  width={1080}
                  height={1080}
                  priority
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16" aria-label="양성화 캠페인 포스터 목록">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <article
                key={project.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-primary/60 hover:shadow-lg"
              >
                <Image src={project.image} alt={project.alt} width={1080} height={1080} className="h-auto w-full" />
                <div className="space-y-3 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{project.number}</p>
                  <h2 className="text-xl font-bold leading-snug text-card-foreground">{project.title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">{project.lead}</p>
                  <Link href={`#${project.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                    자세히 보기
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/20">
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-10 md:grid-cols-3">
            {checks.map(check => (
              <article key={check.label} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{check.label}</p>
                <h2 className="mt-3 text-xl font-bold text-card-foreground">{check.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{check.description}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl space-y-10 px-5 py-12 sm:py-16">
          {projects.map((project, index) => (
            <section
              key={project.id}
              id={project.id}
              className="scroll-mt-24 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:p-8"
            >
              <div className="grid gap-7 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center">
                <Image
                  src={project.image}
                  alt={project.alt}
                  width={1080}
                  height={1080}
                  className="mx-auto h-auto w-full max-w-[360px] rounded-lg border border-border"
                />
                <div className="space-y-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{project.number}</p>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold leading-tight text-card-foreground sm:text-4xl">
                      {project.heading}
                    </h2>
                    <p className="text-lg font-bold leading-7 text-foreground">{project.lead}</p>
                    <p className="text-base leading-7 text-muted-foreground">{project.summary}</p>
                  </div>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {project.issues.map(issue => (
                      <li key={issue} className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground">
                        {issue}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <Link
                      href="/check"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                    >
                      <ClipboardCheck className="h-4 w-4" aria-hidden />
                      {index === projects.length - 1 ? '1분 자가진단 시작' : '양성화 가능성 확인'}
                    </Link>
                    <Link
                      href="/request"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      상담 문의
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-12 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] opacity-80">Next Step</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">우리 건물도 가능할까?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 opacity-85 sm:text-base">
                위반건축물 문제는 방치할수록 복잡해질 수 있습니다. 1분 자가진단으로 현재 상황과 상담 필요 여부를 먼저
                확인해보세요.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/check"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-background px-5 text-sm font-bold text-foreground transition hover:opacity-90"
              >
                1분 자가진단
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/procedure"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-primary-foreground/35 px-5 text-sm font-bold transition hover:bg-primary-foreground/10"
              >
                <FileText className="h-4 w-4" aria-hidden />
                절차 보기
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
