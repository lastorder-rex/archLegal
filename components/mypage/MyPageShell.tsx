'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { HouseHeart } from 'lucide-react';
import type { UserProfile } from '@/types/profile';
import type { ConsultationSummary } from '@/types/mypage';
import { Button } from '@/components/ui/button';
import { MyPageProvider } from '@/components/mypage/MyPageContext';

const tabs = [
  { id: 'info', label: '정보수정', href: '/mypage/info' },
  { id: 'consultations', label: '상담내역', href: '/mypage/consultations' },
  { id: 'payments', label: '결제내역', href: '/mypage/payments' }
] as const;

type TabId = (typeof tabs)[number]['id'];

type MyPageShellProps = {
  profile: UserProfile;
  fallbackEmail: string | null;
  consultations: ConsultationSummary[];
  children: React.ReactNode;
};

export function MyPageShell({ profile, fallbackEmail, consultations, children }: MyPageShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileState, setProfileState] = useState(profile);

  useEffect(() => {
    setProfileState(profile);
  }, [profile]);

  const activeTab: TabId =
    tabs.find(tab => pathname === tab.href || pathname.startsWith(`${tab.href}/`))?.id ?? 'info';

  const contextValue = useMemo(
    () => ({
      profile: profileState,
      fallbackEmail,
      consultations,
      setProfile: setProfileState
    }),
    [consultations, fallbackEmail, profileState]
  );

  return (
    <MyPageProvider value={contextValue}>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div>
              <h1 className="text-lg font-semibold text-foreground">마이페이지</h1>
              <p className="text-sm text-muted-foreground">필요한 메뉴를 선택해 정보를 확인하거나 수정하세요.</p>
            </div>
            <Link href="/">
              <Button type="button" variant="outline" className="flex w-auto items-center gap-2">
                <HouseHeart className="h-4 w-4" aria-hidden />
                홈으로 돌아가기
              </Button>
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-6 md:flex-row">
            <nav className="flex flex-wrap gap-2 md:w-56 md:flex-col">
              {tabs.map(tab => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => router.push(tab.href)}
                    className={clsx(
                      'flex-1 rounded-xl border px-4 py-2 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:flex-none',
                      active
                        ? 'border-primary bg-primary text-primary-foreground shadow'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/70'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            <div className="flex-1">{children}</div>
          </div>
        </div>
      </main>
    </MyPageProvider>
  );
}
