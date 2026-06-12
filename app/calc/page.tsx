import type { Metadata } from 'next';
import { EnforcementFineCalculatorClient } from '@/components/enforcement-fine/EnforcementFineCalculatorClient';

export const revalidate = 0;

export const metadata: Metadata = {
  title: '이행강제금 계산 | 양성화.com - 인건(仁建)',
  description: '주소와 위반면적을 기준으로 위반건축물 이행강제금을 추정 계산합니다.',
  alternates: {
    canonical: 'https://www.archlegal.co.kr/calc'
  },
  openGraph: {
    title: '이행강제금 계산 | 양성화.com - 인건(仁建)',
    description: '주소와 위반면적을 기준으로 위반건축물 이행강제금을 추정 계산합니다.',
    type: 'website'
  }
};

export default function CalcPage() {
  return <EnforcementFineCalculatorClient />;
}
