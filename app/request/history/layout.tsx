import { ReactNode } from 'react';
import { MyPageShell } from '@/components/mypage/MyPageShell';
import { requireUserSession, requireCompletedProfile } from '@/lib/auth/require-session';
import { loadMyPageShellData } from '@/lib/mypage/shell-data';

interface HistoryLayoutProps {
  children: ReactNode;
}

export default async function HistoryLayout({ children }: HistoryLayoutProps) {
  const { supabase, session } = await requireUserSession('/request/history');

  await requireCompletedProfile(supabase, session, {
    nextTo: '/request/history',
    columns: 'profile_completed'
  });

  const { profile, fallbackEmail, consultations } = await loadMyPageShellData(supabase, session);

  return (
    <MyPageShell profile={profile} fallbackEmail={fallbackEmail} consultations={consultations}>
      {children}
    </MyPageShell>
  );
}
