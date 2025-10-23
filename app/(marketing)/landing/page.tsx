import { LandingPage } from '../../../components/landing/LandingPage';
import type { Metadata } from 'next';

export const revalidate = 0;

export const metadata: Metadata = {
  title: '위반 건축물 양성화 솔루션 | 인건(仁建) - 건축물 합법화 전문',
  description: '전국 147,726동의 위반 건축물 합법화를 위한 전문 솔루션. 이행강제금 감경, 건축물대장 정리, 공공기관 협의 대행까지 원스톱 서비스. 2026년 특별조치법 적용 전 골든타임을 놓치지 마세요.',
  keywords: [
    '위반 건축물',
    '건축물 양성화',
    '건축물 합법화',
    '이행강제금',
    '건축물대장',
    '무단 증축',
    '용도변경',
    '특정건축물 정리 특별조치법',
    '건축 위반 해결',
    '건축법 위반',
    '원상복구',
    '시정명령',
    '건축허가',
    '건축 컨설팅'
  ],
  openGraph: {
    title: '위반,불법 건축물 양성화 솔루션 | 인건(仁建)',
    description: '전국 147,726동의 위반 건축물 합법화. 사전 진단부터 사후 모니터링까지 전 과정 솔루션 제공.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '인건',
  },
  twitter: {
    card: 'summary_large_image',
    title: '위반, 불법 건축물 양성화 솔루션 | 인건(仁建)',
    description: '이행강제금 감경, 건축물 합법화 원스톱 서비스. 2026년 특별조치법 적용 전 골든타임.',
  },
  alternates: {
    canonical: 'https://www.archlegal.co.kr/landing',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function MarketingLandingPage() {
  return <LandingPage />;
}
