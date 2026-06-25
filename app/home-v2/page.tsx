import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';
import { LandingKick } from '@/components/landing/LandingKick';

export const revalidate = 0;

// 랜딩 실험 버전: 기존 랜딩(/) 전체 + 히어로 뒤 3D/주소조회 kick 섹션.
// 라이브 /의 중복본이므로 검색 색인 제외(noindex)로 중복 콘텐츠 방지.
export const metadata: Metadata = {
  title: '양성화.com (미리보기) | 위반건축물 양성화',
  robots: { index: false, follow: false },
};

export default function HomeV2Page() {
  return <LandingPage kickSlot={<LandingKick />} />;
}
