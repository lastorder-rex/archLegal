import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { QnaAddressLookup } from '@/components/qna/QnaAddressLookup';
import { QnaScripts } from '@/components/qna/QnaScripts';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
// 스타일은 import로 로드(Next 권장 — no-css-tags). current-model.css 먼저, qna.css 나중
// (원본 로드 순서 = cascade 보존). Pretendard는 qna.css 최상단 @import로 흡수.
import './current-model.css';
import './qna.css';

// 위반건축물 3D 진단·Q&A 랜딩.
// 본문 마크업/스타일/인터랙션은 검증된 정적 자산(public/qna/*)을 그대로 재사용하고,
// 이 페이지는 rex(Next) 패턴 — 메타데이터·OG·JSON-LD·라우팅 — 만 입힌다.
//  - 본문: yangsunghwa-3d-qna.html 의 <body> 내부를 그대로 렌더(파리티 보존)
//  - 스타일: qna.css(+ .qna-page 래퍼로 루트 body 클래스 무력화) / current-model.css
//  - 스크립트: qna-ui.js(진단·Q&A·리빌) / current-model.js(3D 캔버스 엔진)

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: '양성화.com — 내 집 위반건축물, 3D로 직접 짚어보는 진단·Q&A',
  description:
    '3층 다가구주택 3D 모델 위에서 옥상·발코니·주차장·대지 위반건축물 사례를 직접 눌러 확인하고, 양성화(추인·신고·허가) 가능성과 관련 Q&A를 한 화면에서 검토하세요. 무료 자가진단·상담 제공.',
  alternates: { canonical: 'https://www.archlegal.co.kr/qna' },
  // 구버전 3D 페이지 — 메뉴에서 내리고 직접 URL로만 접근. 검색 노출 차단(정식 메뉴는 /qna3d).
  robots: { index: false, follow: false },
  openGraph: {
    title: '내 집 위반건축물, 3D로 직접 짚어보는 진단·Q&A | 양성화.com',
    description:
      '옥상·발코니·주차장 등 실제 위반 사례를 3D 건물에서 직접 눌러 확인하고 양성화 가능성을 검토하세요. 무료 자가진단·상담.',
    url: 'https://www.archlegal.co.kr/qna',
    type: 'website',
  },
};

// 검증된 정적 HTML의 <body> 내부만 추출(끝의 스크립트 태그는 next/script로 따로 로드).
function getQnaBody(): string {
  const html = fs.readFileSync(
    path.join(process.cwd(), 'public/qna/yangsunghwa-3d-qna.html'),
    'utf8'
  );
  const startMarker = '<body id="top">';
  const endMarker = '<script src="/qna/qna-ui.js">';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1) return '';
  const body = html.slice(start + startMarker.length, end);
  // qna 자체 푸터(.footer) 제거 → 공통 SiteFooter로 대체(다른 페이지와 통일).
  // 푸터 뒤 모바일 스티키바(.mbar)·토스트는 보존.
  return body.replace(/<footer class="footer">[\s\S]*?<\/footer>/, '');
}

export default function QnaPage() {
  const body = getQnaBody();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://www.archlegal.co.kr/qna#webpage',
    url: 'https://www.archlegal.co.kr/qna',
    name: '내 집 위반건축물, 3D로 직접 짚어보는 진단·Q&A',
    isPartOf: { '@id': 'https://www.archlegal.co.kr/#website' },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />

      <SiteHeader />

      <div className="qna-page" dangerouslySetInnerHTML={{ __html: body }} />

      {/* 히어로 #qna-lookup-mount 로 portal되는 주소 위반조회 아일랜드 */}
      <QnaAddressLookup />

      {/* 3D 엔진·UI 스크립트 (mount마다 실행 → 클라이언트 내비게이션에서도 캔버스 초기화) */}
      <QnaScripts />

      {/* 공통 푸터 (다른 페이지와 통일) */}
      <SiteFooter />
    </>
  );
}
