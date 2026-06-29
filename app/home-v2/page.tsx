import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';
import { Landing3DPreview } from '@/components/landing/Landing3DPreview';

export const revalidate = 0;

// 랜딩 실험 버전: 히어로 우측 카드를 「내 집 양성화 리포트」 주소박스로 교체(주소 우선 진단)
// + 히어로 바로 아래 3D 위반사례 섹션. 라이브 /의 변형본이므로 검색 색인 제외(noindex).
export const metadata: Metadata = {
  title: '양성화.com (미리보기) | 위반건축물 양성화',
  robots: { index: false, follow: false },
};

export default function HomeV2Page() {
  return <LandingPage addressHero kickSlot={<Landing3DPreview />} />;
}
