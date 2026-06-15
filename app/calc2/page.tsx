import type { Metadata } from 'next';
import { EnforcementFineCalculatorClient } from '@/components/enforcement-fine/EnforcementFineCalculatorClient';

export const revalidate = 0;

export const metadata: Metadata = {
  title: '이행강제금 계산 검증',
  robots: {
    index: false,
    follow: false
  }
};

export default function Calc2Page() {
  return <EnforcementFineCalculatorClient showInternalCalculationDetails loginNextPath="/calc2" />;
}
