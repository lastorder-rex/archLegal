import type { Metadata } from 'next';
import { ViolationMapClient } from '@/components/violation-map/ViolationMapClient';

export const revalidate = 0;

export const metadata: Metadata = {
  title: '위반건축물 지도 | 양성화.com - 인건(仁建)',
  description: '구로구 오류동 위반건축물을 지도에서 한눈에 확인하세요. 단독·공동·근린 주거 건축물의 위반 등재 현황을 마커로 표시합니다.',
  robots: { index: false, follow: false },
};

export default function MapPage() {
  return <ViolationMapClient />;
}
