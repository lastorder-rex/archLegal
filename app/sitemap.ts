import type { MetadataRoute } from 'next';
import { SEOUL_DISTRICTS } from '@/lib/constants/seoul-districts';
import { getAllArticles } from '@/lib/guide/articles';

// 코드 기반 사이트맵. public/sitemap.xml 을 대체(라우트 충돌 방지 위해 파일 삭제).
// 로그인 필요/저품질 URL(/signup·/login·/mypage·/request/history·정적 html)은 색인 가치가 없어 제외.

const SITE = 'https://www.archlegal.co.kr';
const STATIC_DATE = new Date('2026-07-04');

type StaticEntry = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
};

const STATIC_ROUTES: StaticEntry[] = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/special-act', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/guide', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/check', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/calc', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/qna3d', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/request', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/map', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/enforcement-stats', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/region', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/card-news', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/campaign', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/landing', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/press', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/procedure', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/privacy-policy', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/refund-policy', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/terms-of-service', priority: 0.4, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(r => ({
    url: `${SITE}${r.path}`,
    lastModified: STATIC_DATE,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const regionEntries: MetadataRoute.Sitemap = SEOUL_DISTRICTS.map(d => ({
    url: `${SITE}/region/${encodeURIComponent(d.name)}`,
    lastModified: STATIC_DATE,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const guideEntries: MetadataRoute.Sitemap = getAllArticles().map(a => ({
    url: `${SITE}/guide/${encodeURIComponent(a.slug)}`,
    lastModified: a.datePublished ? new Date(a.datePublished) : STATIC_DATE,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticEntries, ...regionEntries, ...guideEntries];
}
