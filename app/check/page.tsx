import type { Metadata } from 'next';
import { LegalizationCheckClient } from '@/components/diagnosis/LegalizationCheckClient';
import './diagnosis.css';

export const revalidate = 0;

export const metadata: Metadata = {
  title: '1분 양성화 자가진단 | 양성화.com - 인건(仁建)',
  description: '1분 양성화 자가진단으로 특정건축물 정리에 관한 특별조치법 기준의 건축물 양성화 가능성을 간단히 확인하세요.',
  openGraph: {
    title: '1분 양성화 자가진단 | 양성화.com - 인건(仁建)',
    description: '특정건축물 정리에 관한 특별조치법 기준으로 건축물 양성화 가능성을 1분 안에 간단히 확인하세요.',
    type: 'website'
  },
  alternates: {
    canonical: 'https://www.archlegal.co.kr/check'
  }
};

export default function CheckPage() {
  return <LegalizationCheckClient />;
}
