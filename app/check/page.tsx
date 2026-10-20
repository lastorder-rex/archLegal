import type { Metadata } from 'next';
import { LegalizationCheckClient } from '@/components/diagnosis/LegalizationCheckClient';
import { SiteHeader } from '@/components/layout/SiteHeader';
import './diagnosis.css';

export const revalidate = 0;

export const metadata: Metadata = {
  title: '1분 양성화 자가진단 | 양성화.com - 인건(仁建)',
  description: '1분 양성화 자가진단으로 특정건축물 정리에 관한 특별조치법 기준의 건축물 양성화 가능성을 간단히 확인하세요.',
  openGraph: {
    title: '1분 양성화 자가진단 | 양성화.com - 인건(仁建)',
    description: '특정건축물 정리에 관한 특별조치법 기준으로 건축물 양성화 가능성을 1분 안에 간단히 확인하세요.',
    url: 'https://www.archlegal.co.kr/check',
    type: 'website',
    images: [
      {
        url: 'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/kakao_b.png'
      }
    ]
  },
  alternates: {
    canonical: 'https://www.archlegal.co.kr/check'
  }
};

export default function CheckPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://www.archlegal.co.kr/check#webpage',
        url: 'https://www.archlegal.co.kr/check',
        name: '1분 양성화 자가진단',
        description: '특정건축물 정리에 관한 특별조치법 기준의 건축물 양성화 가능성을 1분 안에 확인하는 자가진단 페이지입니다.',
        isPartOf: {
          '@id': 'https://www.archlegal.co.kr/#website'
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://www.archlegal.co.kr/check#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: '양성화.com',
            item: 'https://www.archlegal.co.kr/'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '1분 양성화 자가진단',
            item: 'https://www.archlegal.co.kr/check'
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiteHeader />
      <LegalizationCheckClient />
    </>
  );
}
