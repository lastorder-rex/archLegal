import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

// ─────────────────────────────────────────────────────────────────────────────
// 양성화 가이드 아티클 로더.
// content/guide/*.md 를 빌드 타임(정적 생성 시점)에만 fs로 읽어 파싱한다.
// 모든 가이드 라우트는 generateStaticParams + 기본 정적 렌더이므로 런타임 fs 접근이 없다.
// fs 접근은 반드시 process.cwd() 기준.
// ─────────────────────────────────────────────────────────────────────────────

export type GuideCategory = '기초' | '위반유형' | '비용·이행강제금' | '거래·계약' | '진단·상담';

export type GuideArticle = {
  slug: string;
  title: string;
  description: string;
  category: GuideCategory;
  datePublished: string;
  keywords: string[];
  /** 마크다운 원문(본문만, frontmatter 제외) */
  content: string;
  /** marked로 변환한 HTML */
  html: string;
};

const GUIDE_DIR = path.join(process.cwd(), 'content', 'guide');

marked.setOptions({ gfm: true, breaks: false });

// gray-matter는 YAML의 `datePublished: 2026-07-04`를 Date 객체로 파싱하므로 항상 YYYY-MM-DD 문자열로 정규화.
function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(value ?? ''));
  return m ? m[1] : '';
}

function parseFile(fileName: string): GuideArticle {
  const raw = fs.readFileSync(path.join(GUIDE_DIR, fileName), 'utf8');
  const { data, content } = matter(raw);
  const slug = String(data.slug ?? fileName.replace(/\.md$/, ''));
  const keywords = Array.isArray(data.keywords)
    ? data.keywords.map((k: unknown) => String(k))
    : [];
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ''),
    category: (data.category ?? '기초') as GuideCategory,
    datePublished: normalizeDate(data.datePublished),
    keywords,
    content,
    html: marked.parse(content) as string,
  };
}

/** content/guide/*.md 전체를 datePublished 내림차순(동일 날짜는 slug 오름차순)으로 반환. */
export function getAllArticles(): GuideArticle[] {
  const files = fs.readdirSync(GUIDE_DIR).filter(f => f.endsWith('.md'));
  return files
    .map(parseFile)
    .sort((a, b) => {
      if (a.datePublished !== b.datePublished) {
        return a.datePublished < b.datePublished ? 1 : -1;
      }
      return a.slug.localeCompare(b.slug, 'ko');
    });
}

/** 단건 조회. 없으면 null. */
export function getArticle(slug: string): GuideArticle | null {
  return getAllArticles().find(a => a.slug === slug) ?? null;
}

/** 같은 카테고리를 우선해 관련 글 n개(자기 자신 제외) 반환. */
export function getRelatedArticles(slug: string, limit = 3): GuideArticle[] {
  const all = getAllArticles();
  const current = all.find(a => a.slug === slug);
  if (!current) return all.slice(0, limit);
  const others = all.filter(a => a.slug !== slug);
  const sameCategory = others.filter(a => a.category === current.category);
  const rest = others.filter(a => a.category !== current.category);
  return [...sameCategory, ...rest].slice(0, limit);
}

export const GUIDE_CATEGORY_ORDER: GuideCategory[] = [
  '기초',
  '위반유형',
  '비용·이행강제금',
  '거래·계약',
  '진단·상담',
];
