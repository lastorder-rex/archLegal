import type { Metadata } from 'next';
import { AboutContent } from '@/components/landing/AboutContent';
import { fullFaqs } from '@/lib/constants/landingPageData';

export const metadata: Metadata = {
  title: '우리의 역할 | 양성화.com - 인건(仁建)',
  description:
    'ArchLegal은 위반 건축물 양성화를 통해 법적 리스크와 재산 손실을 줄이는 전문 컨설팅을 제공합니다. 시장 현황과 솔루션을 확인하세요.'
};

export default function AboutPage() {
  return (
    <main className="bg-background">
      <div className="mx-auto w-full max-w-4xl px-6 py-16 md:py-24">
        <header className="space-y-3 text-center">
          <p className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            우리의 역할
          </p>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">ArchLegal은 이런 문제를 해결합니다</h1>
          <p className="text-base text-muted-foreground md:text-lg">
            위반 건축물 양성화를 통해 법적 리스크와 재산 손실을 줄이고 안전한 시장 환경을 만듭니다.
          </p>
        </header>

        <div className="mt-12 space-y-8">
          <AboutContent faqs={fullFaqs} />
        </div>
      </div>
    </main>
  );
}
