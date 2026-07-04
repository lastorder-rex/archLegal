import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';
import { Landing3DPreview } from '@/components/landing/Landing3DPreview';

export const revalidate = 0;

// 루트 canonical만 지정(레이아웃 metadata와 병합 — title 등은 레이아웃 값 유지).
export const metadata: Metadata = {
  alternates: { canonical: 'https://www.archlegal.co.kr/' },
};

// 메인: 히어로 우측을 「내 집 양성화 리포트」 주소박스로(주소 우선 진단) + 히어로 아래 3D 위반사례 섹션.
// (구 /home-v2 실험본을 루트로 승격. 레이아웃 메타데이터로 색인 허용.)
export default function HomePage() {
  return <LandingPage addressHero kickSlot={<Landing3DPreview />} />;
}
