import type { Metadata } from 'next';
import PrivateCaseRoom from '@/components/private-case/PrivateCaseRoom';
import './case-room.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: '비공개 자료실',
  description: '접근 권한이 필요한 개인 자료실입니다.',
  robots: { index: false, follow: false, noarchive: true },
  openGraph: null,
  twitter: null,
};

export default function CaseRoomPage() {
  return <PrivateCaseRoom />;
}
