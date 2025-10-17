import { ReactNode } from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isUserSessionExpired } from '@/lib/auth/user-session';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HouseHeart } from 'lucide-react';

interface HistoryLayoutProps {
  children: ReactNode;
}

export default async function HistoryLayout({ children }: HistoryLayoutProps) {
  const cookieStore = cookies();

  if (isUserSessionExpired(cookieStore)) {
    redirect('/login?redirect=/request/history');
  }

  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login?redirect=/request/history');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('profile_completed')
    .eq('auth_id', session.user.id)
    .maybeSingle();

  if (!profile?.profile_completed) {
    redirect(`/signup?next=${encodeURIComponent('/request/history')}`);
  }

  const tabs = [
    { id: 'info', label: '정보수정', href: '/mypage/info' },
    { id: 'consultations', label: '상담내역', href: '/mypage/consultations' },
    { id: 'history', label: '상담내역 상세', href: '/request/history' },
    { id: 'payments', label: '결제내역', href: '/mypage/payments' }
  ] as const;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">마이페이지</h2>
              <p className="text-sm text-muted-foreground">필요한 메뉴를 선택해 정보를 확인하거나 수정하세요.</p>
            </div>
            <Link href="/">
              <Button
                type="button"
                variant="outline"
                className="flex w-auto items-center gap-2"
              >
                <HouseHeart className="h-4 w-4" aria-hidden />
                홈으로 돌아가기
              </Button>
            </Link>
          </div>

          <div className="flex flex-col gap-6 md:flex-row">
            <nav className="flex flex-wrap gap-2 md:w-56 md:flex-col">
              {tabs.map(tab => {
                const active = tab.id === 'history';
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`flex-1 rounded-xl border px-4 py-2 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:flex-none ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground shadow'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/70'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex-1">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
