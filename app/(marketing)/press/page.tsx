import Link from 'next/link';
import { SiteHeader } from '@/components/layout/SiteHeader';

const PDF_URL = 'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/company-interview.pdf';

export const metadata = {
  title: '언론보도 및 인터뷰 | 양성화.com',
  description:
    '양성화.com의 위반건축물 양성화 상담, 특정건축물 정리에 관한 특별조치법, 이행강제금, 건축물대장 위반 표시 관련 보도자료와 인터뷰를 확인하세요.'
};

export default function PressPage() {
  const relatedLinks = [
    { href: '/check', label: '1분 자가진단' },
    { href: '/procedure', label: '양성화 절차 보기' },
    { href: '/about', label: '우리의 역할 보기' }
  ];

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pt-6 pb-0 sm:pt-8">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">언론보도 및 인터뷰</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              양성화.com은 위반건축물, 불법건축물, 특정건축물 정리에 관한 특별조치법, 이행강제금,
              건축물대장 위반 표시 등과 관련된 정보를 일반인이 이해하기 쉽게 제공하는 상담 플랫폼입니다. 이
              페이지는 양성화.com의 보도자료, 인터뷰, 외부 소개 자료를 확인할 수 있는 신뢰도 페이지입니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                새 창에서 보기
              </Link>
              <Link
                href={PDF_URL}
                download
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                PDF 다운로드
              </Link>
            </div>
          </header>

          <section className="flex flex-col gap-4 pb-0">
            <object
              data={PDF_URL}
              type="application/pdf"
              className="h-[calc(80vh+200px)] w-full rounded-xl border border-border bg-card"
              aria-label="언론보도 PDF 뷰어"
            >
              <div className="rounded-xl border border-border bg-card p-4 text-xs leading-5 text-muted-foreground">
                <p className="font-medium text-foreground">PDF 뷰어를 불러오지 못했습니다.</p>
                <p className="mt-2">
                  PDF를 다운로드하여 확인하려면{' '}
                  <Link href={PDF_URL} download className="text-primary underline underline-offset-4">
                    여기
                  </Link>
                  를 클릭하세요.
                </p>
              </div>
            </object>
          </section>

          <section className="grid gap-4 md:grid-cols-3" aria-label="언론보도 페이지 요약">
            <article className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-card-foreground">양성화.com이 다루는 문제</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                위반건축물 문제는 건축물대장 표시, 이행강제금, 매매·임대 과정의 불안, 세움터 신청 절차 등으로
                이어질 수 있습니다. 양성화.com은 사용자가 특별조치법 대상인지, 일반 인허가 검토가 필요한지,
                건축사 상담이 필요한지 판단할 수 있도록 돕는 것을 목표로 합니다.
              </p>
            </article>
            <article className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-card-foreground">주요 상담 영역</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                특정건축물 정리에 관한 특별조치법 대상 여부, 건축물대장 위반 표시, 이행강제금, 무단 증축,
                무단 용도변경, 옥상 구조물, 베란다·발코니 확장, 주차장 용도변경 등 실생활에서 자주 발생하는
                위반건축물 문제를 중심으로 상담 흐름을 제공합니다.
              </p>
            </article>
            <article className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-card-foreground">상담 전 확인하면 좋은 자료</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                건축물 주소, 건축물대장, 위반 통보서 또는 이행강제금 고지서, 현장 사진, 기존 도면이나 매매
                관련 자료를 준비하면 검토가 더 정확해질 수 있습니다. 실제 가능성 판단은 건축물 상태와 관할
                지자체 기준에 따라 달라질 수 있습니다.
              </p>
            </article>
          </section>

          <section className="rounded-xl border border-border bg-muted/40 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm leading-6 text-muted-foreground">
                위반건축물 여부가 불확실하다면 먼저 자가진단과 절차 안내를 확인해보세요.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {relatedLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
