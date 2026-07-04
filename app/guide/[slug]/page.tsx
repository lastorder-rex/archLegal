import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Calculator, ClipboardCheck, MessageSquare, Search } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { getAllArticles, getArticle, getRelatedArticles } from '@/lib/guide/articles';
import './../guide.css';

export const dynamic = 'force-static';

const SITE = 'https://www.archlegal.co.kr';
const OG_IMAGE =
  'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/archlegal-og.png';

export function generateStaticParams() {
  // 한글 슬러그 그대로 반환. Next가 인코딩해 라우팅한다.
  return getAllArticles().map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const article = getArticle(slug);
  if (!article) return { title: '가이드를 찾을 수 없습니다 | 양성화.com' };
  const title = `${article.title} | 양성화.com`;
  const url = `${SITE}/guide/${encodeURIComponent(slug)}`;
  return {
    title,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: article.description,
      url,
      type: 'article',
      publishedTime: article.datePublished,
      images: [{ url: OG_IMAGE }],
    },
  };
}

export default function GuideArticlePage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const article = getArticle(slug);
  if (!article) notFound();

  const url = `${SITE}/guide/${encodeURIComponent(slug)}`;
  const org = {
    '@type': 'Organization',
    name: '인건(仁建) 양성화.com',
    url: SITE,
    logo: OG_IMAGE,
  };
  const related = getRelatedArticles(slug, 3);

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        datePublished: article.datePublished,
        dateModified: article.datePublished,
        author: org,
        publisher: org,
        mainEntityOfPage: url,
        image: OG_IMAGE,
        keywords: article.keywords.join(', '),
        isPartOf: { '@id': `${SITE}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '양성화.com', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: '양성화 가이드', item: `${SITE}/guide` },
          { '@type': 'ListItem', position: 3, name: article.title, item: url },
        ],
      },
    ],
  };

  const publishedLabel = formatKoreanDate(article.datePublished);

  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <main className="min-h-screen bg-background select-text">
        {/* 히어로 헤더 */}
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-14">
            <nav aria-label="breadcrumb" className="text-xs text-muted-foreground">
              <Link href="/guide" className="underline-offset-4 transition hover:text-primary hover:underline">
                양성화 가이드
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-foreground">{article.category}</span>
            </nav>
            <p className="mt-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {article.category}
            </p>
            <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
              {article.title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">게시일 {publishedLabel}</p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-12">
          {/* 본문 */}
          <article
            className="guide-prose select-text"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />

          {/* ① 관련 글 */}
          {related.length > 0 && (
            <section className="mt-14 border-t border-border pt-8">
              <h2 className="text-lg font-bold text-foreground">함께 보면 좋은 가이드</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {related.map(r => (
                  <li key={r.slug}>
                    <Link
                      href={`/guide/${encodeURIComponent(r.slug)}`}
                      className="flex h-full flex-col rounded-xl border border-border bg-card p-4 transition hover:border-primary"
                    >
                      <span className="text-xs font-semibold text-primary">{r.category}</span>
                      <span className="mt-1.5 text-sm font-bold leading-snug text-foreground">{r.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ② 전환 CTA */}
          <section className="mt-10 rounded-2xl border border-border bg-primary/5 p-6 text-center">
            <h2 className="text-xl font-extrabold text-foreground">내 집이 대상인지, 지금 확인하세요</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              주소만 넣으면 위반 등재 여부·양성화 가능성을 확인할 수 있습니다.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/?address=open"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-extrabold text-primary-foreground transition hover:opacity-90"
              >
                <Search className="h-5 w-5" aria-hidden />
                내 집 주소로 진단
              </Link>
              <Link
                href="/check"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary px-6 text-base font-bold text-primary transition hover:bg-primary/10"
              >
                <ClipboardCheck className="h-5 w-5" aria-hidden />
                1분 자가진단
              </Link>
              <Link
                href="/?consultation=open"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary px-6 text-base font-bold text-primary transition hover:bg-primary/10"
              >
                <MessageSquare className="h-5 w-5" aria-hidden />
                무료 상담
              </Link>
              <Link
                href="/calc"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary px-6 text-base font-bold text-primary transition hover:bg-primary/10"
              >
                <Calculator className="h-5 w-5" aria-hidden />
                이행강제금 계산
              </Link>
            </div>
            <p className="mt-4 text-sm">
              <Link href="/guide" className="font-semibold text-primary underline-offset-4 hover:underline">
                양성화 가이드 전체 보기
                <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden />
              </Link>
            </p>
          </section>

          {/* ③ 신뢰 푸터 */}
          <section className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              인건(仁建) 위반건축물 양성화 전문팀 검토
            </p>
            <p className="mt-2 leading-6">
              본 가이드는 일반적인 정보 안내이며 개별 사안의 법률 자문을 대신하지 않습니다. 구체적 판단은 관할 지자체 및
              전문가 상담을 통해 확인하세요.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function formatKoreanDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일`;
}
