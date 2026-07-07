import { MyPageShell } from '@/components/mypage/MyPageShell';
import { requireUserSession } from '@/lib/auth/require-session';
import { loadMyPageShellData } from '@/lib/mypage/shell-data';

export const revalidate = 0;

type MyPageLayoutProps = {
  children: React.ReactNode;
};

export default async function MyPageLayout({ children }: MyPageLayoutProps) {
  const { supabase, session } = await requireUserSession('/mypage', { checkAuthError: true });

  const { profile, fallbackEmail, consultations } = await loadMyPageShellData(supabase, session);

  return (
    <MyPageShell profile={profile} fallbackEmail={fallbackEmail} consultations={consultations}>
      {children}
    </MyPageShell>
  );
}
