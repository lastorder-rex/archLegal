import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ClipboardCheck, FileText, HouseHeart, MessageCircle } from 'lucide-react';
import { CardNewsCarousel } from '@/components/card-news/CardNewsCarousel';
import { SiteFooter } from '@/components/layout/SiteFooter';

export const revalidate = 0;

export const metadata: Metadata = {
  title: '양성화 카드뉴스 | 양성화.com - 인건(仁建)',
  description: '양성화.com에서 위반건축물 양성화 절차와 특정건축물 정리 특별조치법의 핵심 확인사항을 카드뉴스로 확인하세요.',
  openGraph: {
    title: '양성화 카드뉴스 | 양성화.com - 인건(仁建)',
    description: '양성화.com에서 위반건축물 양성화 절차와 핵심 확인사항을 한눈에 확인하세요.',
    type: 'article',
    images: ['/card1.png']
  },
  alternates: {
    canonical: 'https://www.archlegal.co.kr/card-news'
  }
};

export default function CardNewsPage() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
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

      <main className="min-h-screen bg-background">
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto grid w-full max-w-6xl gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div className="space-y-3">
              <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                양성화 핵심정리
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                  위반건축물 양성화,
                  <br className="hidden sm:block" />
                  핵심만 카드뉴스로 확인하세요
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  특정건축물 정리 특별조치법과 양성화 절차를 처음 확인하는 분들이 빠르게 흐름을 잡을 수 있도록
                  주요 내용을 카드뉴스 형태로 정리했습니다.
                </p>
              </div>
            </div>

            <div className="hidden gap-3 text-sm sm:grid sm:grid-cols-3 lg:grid-cols-1">
              <Link
                href="/check"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                1분 양성화 자가진단
              </Link>
              <Link
                href="/procedure"
                className="inline-flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                <FileText className="h-5 w-5" aria-hidden="true" />
                양성화 절차 자세히 보기
              </Link>
              <Link
                href="/request"
                className="inline-flex items-center gap-3 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                무료 상담 신청
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <CardNewsCarousel />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
