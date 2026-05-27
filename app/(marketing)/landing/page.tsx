import { LandingPage } from '../../../components/landing/LandingPage';
import type { Metadata } from 'next';

export const revalidate = 0;

export const metadata: Metadata = {
  title: '양성화.com | 인건(仁建) 위반건축물 양성화 전문 플랫폼',
  description: '양성화.com은 인건(仁建)의 위반건축물·불법건축물 양성화 상담 서비스입니다. 특정건축물 정리, 추인허가, 이행강제금 상담을 제공합니다.',
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
    title: '양성화.com | 인건(仁建) 위반건축물 양성화 전문 플랫폼',
    description: '양성화.com은 인건(仁建)의 위반건축물·불법건축물 양성화 상담 서비스입니다. 특정건축물 정리, 추인허가, 이행강제금 상담을 제공합니다.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '양성화.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: '양성화.com | 인건(仁建) 위반건축물 양성화 전문 플랫폼',
    description: '양성화.com은 인건(仁建)의 위반건축물·불법건축물 양성화 상담 서비스입니다. 특정건축물 정리, 추인허가, 이행강제금 상담을 제공합니다.',
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
