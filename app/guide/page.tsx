import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { getAllArticles, GUIDE_CATEGORY_ORDER } from '@/lib/guide/articles';

export const dynamic = 'force-static';

const SITE = 'https://www.archlegal.co.kr';
const URL = `${SITE}/guide`;
const TITLE = '위반건축물 양성화 가이드 — 절차·비용·사례 총정리 | 양성화.com';
const DESCRIPTION =
  '위반건축물 양성화 절차, 이행강제금, 위반 유형, 매매·전세 리스크까지 20편으로 정리한 양성화 가이드입니다. 특별조치법(2026.12.17 시행) 기준으로 확인하세요.';
const OG_IMAGE =
  'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/archlegal-og.png';

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

export default function GuideIndexPage() {
  const articles = getAllArticles();

  const grouped = GUIDE_CATEGORY_ORDER.map(category => ({
    category,
    items: articles.filter(a => a.category === category),
  })).filter(g => g.items.length > 0);

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: '위반건축물 양성화 가이드',
        description: DESCRIPTION,
        url: URL,
        isPartOf: { '@id': `${SITE}/#website` },
      },
      {
        '@type': 'ItemList',
        itemListElement: articles.map((a, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE}/guide/${encodeURIComponent(a.slug)}`,
          name: a.title,
        })),
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <main className="min-h-screen bg-background select-text">
        {/* 히어로 */}
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              양성화 가이드 · {articles.length}편
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              위반건축물 양성화 가이드
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              위반건축물 양성화의 절차와 비용, 위반 유형, 매매·전세 리스크를 주제별로 정리했습니다.{' '}
              <Link href="/special-act" className="font-semibold text-primary underline underline-offset-4 hover:opacity-80">
                특별조치법
              </Link>
              (2026년 12월 17일 시행, 18개월 한시) 대상 여부와 이행강제금 부담을 판단하는 데 필요한 기준을 한 곳에서
              확인할 수 있습니다.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl space-y-12 px-6 py-12">
          {grouped.map(group => (
            <section key={group.category} aria-label={group.category}>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">{group.category}</h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map(a => (
                  <li key={a.slug}>
                    <Link
                      href={`/guide/${encodeURIComponent(a.slug)}`}
                      className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-primary hover:shadow-sm"
                    >
                      <h3 className="text-base font-bold leading-snug text-foreground">{a.title}</h3>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">
                        {a.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
