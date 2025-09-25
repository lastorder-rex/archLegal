'use client';

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { CTAButton } from '../ui/cta-button';
import { ThemeToggle } from '../ui/theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { ConsultationModal } from './ConsultationModal';
import { LoginModal } from './LoginModal';
import { InfoCard } from './InfoCard';
import { Timeline } from './Timeline';

const interestItems = [
  {
    title: '시행 기간',
    highlight: '2025.01.01 - 2025.12.31',
    description: '특별법 시행은 1년 한정입니다. 기회를 놓치면 다시 진행하기 어렵습니다.'
  },
  {
    title: '소요 기간',
    highlight: '총 2~3개월',
    description: '준비부터 완료까지 평균 2~3개월. 건축위원회 심의는 1~2개월이 소요됩니다.'
  }
];

const desireItems = [
  {
    icon: '💰',
    title: '낮춘 비용 부담',
    description: '합법화 절차를 통해 과태료·추가 공사 비용을 최소화합니다.'
  },
  {
    icon: '📈',
    title: '재산 가치 상승',
    description: '건축물대장 등재 후 매매·임대 시 자산 가치가 상승합니다.'
  },
  {
    icon: '🏦',
    title: '금융거래 가능',
    description: '담보 설정, 대출 등 금융거래가 가능해져 자금 조달이 수월합니다.'
  },
  {
    icon: '🛡️',
    title: '안전한 재산권 확보',
    description: '법적 리스크 제거로 안심하고 건축물을 운영할 수 있습니다.'
  }
];

const timelineSteps = [
  '무료상담',
  '신고서 작성',
  '현장조사',
  '위원회 심의',
  '건축물대장 등재',
  '사용승인',
  '재산가치 상승'
];

const navigationItems = [
  { label: '법시행안내', target: 'attention-section' },
  { label: '양성화절차', target: 'interest-section' },
  { label: '상담안내', target: 'action-section' }
];

export function LandingPage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [isNavOpen, setNavOpen] = useState(false);
  const supabase = useMemo(() => createClientComponentClient(), []);
  const router = useRouter();
  const procedureGuideUrl = useMemo(() => encodeURI('/docu/양성화 절차 안내.pdf'), []);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (active) {
        setSessionUser(user ?? null);
        if (user) {
          setLoginModalOpen(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
      if (session?.user) {
        setLoginModalOpen(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSessionUser(null);
      setLoginModalOpen(false);
      router.refresh();
      router.replace('/');
    }
  }, [router, supabase]);

  const handleDownloadGuide = useCallback(() => {
    const link = document.createElement('a');
    link.href = procedureGuideUrl;
    link.download = '양성화 절차 안내.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [procedureGuideUrl]);

  const handleSectionNavigate = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, targetId: string) => {
      event.preventDefault();
      setNavOpen(false);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [setNavOpen]
  );

  const renderAuthButton = useCallback(
    (size: 'desktop' | 'mobile') => {
      const sizeClasses =
        size === 'desktop'
          ? 'px-4 py-1.5 text-xs sm:text-sm'
          : 'px-3 py-1 text-xs';
      const baseClasses =
        'rounded-full border border-white/50 font-semibold text-white transition hover:border-white hover:bg-white/10';

      if (sessionUser) {
        return (
          <button
            type="button"
            onClick={handleLogout}
            className={`${baseClasses} ${sizeClasses}`}
          >
            로그아웃
          </button>
        );
      }

      return (
        <button
          type="button"
          onClick={() => setLoginModalOpen(true)}
          className={`${baseClasses} ${sizeClasses}`}
        >
          로그인
        </button>
      );
    },
    [handleLogout, sessionUser, setLoginModalOpen]
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-200">
      <ConsultationModal open={isModalOpen} onClose={() => setModalOpen(false)} />
      <LoginModal open={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />

      {/* Attention */}
      <section
        className="relative isolate overflow-hidden bg-slate-900/50 text-white"
        aria-labelledby="attention-section"
      >
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(24,24,27,0.15), rgba(24,24,27,0.15)), url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <header className="absolute inset-x-0 top-0 z-20 bg-slate-950/30 pb-4 pt-6 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
            <a
              href="#attention-section"
              className="text-sm font-semibold uppercase tracking-[0.35em] text-white/70 transition hover:text-white"
            >
              Interworld
            </a>
            <div className="flex items-center gap-3">
              <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 lg:flex">
                {navigationItems.map(({ label, target }) => (
                  <a
                    key={target}
                    href={`#${target}`}
                    onClick={(event) => handleSectionNavigate(event, target)}
                    className="transition hover:text-white"
                  >
                    {label}
                  </a>
                ))}
                {renderAuthButton('desktop')}
                <ThemeToggle />
              </nav>
              <div className="flex items-center gap-2 lg:hidden">
                {renderAuthButton('mobile')}
                <ThemeToggle />
                <Sheet open={isNavOpen} onOpenChange={setNavOpen}>
                  <SheetTrigger asChild>
                    <button
                      type="button"
                      aria-label="메뉴 열기"
                      className="rounded-full border border-white/50 p-2 text-white transition hover:border-white hover:bg-white/10"
                    >
                      <Menu className="h-5 w-5" aria-hidden />
                    </button>
                  </SheetTrigger>
                  <SheetContent className="flex flex-col bg-background text-foreground">
                    <nav className="mt-10 flex flex-col gap-6 text-base font-medium">
                      {navigationItems.map(({ label, target }) => (
                        <a
                          key={target}
                          href={`#${target}`}
                          onClick={(event) => handleSectionNavigate(event, target)}
                          className="transition hover:text-primary"
                        >
                          {label}
                        </a>
                      ))}
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-24 sm:py-32 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1 space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-foreground opacity-70">
              Special Act 2025
            </p>
            <h1 id="attention-section" className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              특정건축물 정리에 관한 특별법 안내
            </h1>
            <p className="text-lg text-primary-foreground opacity-80 sm:text-xl">
              2025년 특정건축물 정리에 관한 특별 조치법 시행
              단 1년의 기회! 지금 준비를 시작해야
              안전하게 합법화할 수 있습니다.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <CTAButton className="sm:w-auto" onClick={() => setModalOpen(true)}>
                무료 상담 신청
              </CTAButton>
              <CTAButton tone="secondary" className="sm:w-auto" onClick={handleDownloadGuide}>
                절차 자세히 보기
              </CTAButton>
            </div>
          </div>
          <div className="flex-1">
            <div className="rounded-3xl border border-white bg-white/10 p-8 shadow-2xl backdrop-blur">
              <h2 className="text-xl font-semibold text-white">필수 일정 요약</h2>
              <dl className="mt-6 grid grid-cols-1 gap-4 text-sm text-slate-100 sm:grid-cols-2">
                {interestItems.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white bg-white/10 p-4">
                    <dt className="text-xs uppercase tracking-wide text-primary-foreground opacity-70 text-slate-200">{item.title}</dt>
                    <dd className="mt-2 text-lg font-semibold text-white">{item.highlight}</dd>
                    <p className="mt-2 text-xs font-medium text-white">{item.description}</p>
                  </div>
                ))}
              </dl>
              <p className="mt-6 inline-flex items-center rounded-full border border-white/70 bg-white/90 px-4 py-1 text-sm font-semibold text-amber-500 shadow-sm">
                빠르게 준비해야 안전합니다.
              </p>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-[0.625rem] font-semibold uppercase tracking-[0.35em] text-white/70"
        >
          <div className="flex h-14 w-8 items-start justify-center rounded-full border border-white/60 p-2">
            <span
              className="block h-2 w-2 rounded-full bg-white/80"
              style={{ animation: 'scroll-indicator 2.4s ease-in-out infinite' }}
            />
          </div>
          <span>Scroll</span>
        </div>
      </section>

      {/* Interest */}
      <section
        className="relative isolate overflow-hidden border-y border-primary/10 bg-secondary py-20 transition-colors duration-200 dark:border-primary/20 dark:bg-secondary"
        aria-labelledby="interest-section"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/15 via-white to-transparent dark:from-primary/25 dark:via-slate-900/80 dark:to-slate-950" />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Interest</p>
            <h2 id="interest-section" className="text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
              법 시행 안내 & 소요 기간
            </h2>
            <p className="text-base text-slate-700 dark:text-slate-200">
              특별법 시행 기간은 단 1년입니다. 건축위원회 심의 일정까지 고려하면 지금 바로 준비해야
              여유롭게 절차를 마칠 수 있습니다.
            </p>
          </div>
          <div className="grid w-full gap-6 sm:grid-cols-2 lg:max-w-3xl">
            <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm shadow-primary/10">
              <h3 className="text-lg font-semibold text-foreground">건축위원회 심의</h3>
              <p className="mt-2 text-3xl font-bold text-primary">1~2개월</p>
              <p className="mt-3 text-sm text-muted-foreground">
                제출 서류 검토와 현장 점검까지 평균 4–8주가 소요됩니다.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm shadow-primary/10">
              <h3 className="text-lg font-semibold text-foreground">전체 완료</h3>
              <p className="mt-2 text-3xl font-bold text-primary">2~3개월</p>
              <p className="mt-3 text-sm text-muted-foreground">
                최종 사용 승인까지 고려하면 최소 8주 이상을 확보해야 안전합니다.
              </p>
            </div>
            <div className="sm:col-span-2 rounded-2xl border border-primary/30 bg-accent p-6">
              <p className="text-sm font-semibold text-accent-foreground">긴급 안내</p>
              <p className="mt-2 text-base font-medium text-accent-foreground/90">
                빠르게 준비해야 안전합니다. 초기 상담부터 문서 준비까지 전문가가 함께합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Desire */}
      <section
        className="relative isolate overflow-hidden py-20 transition-colors duration-200"
        aria-labelledby="desire-section"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/40 via-background/60 to-accent/10 dark:from-accent/35 dark:via-slate-900/70 dark:to-slate-950" />
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Desire</p>
            <h2
              id="desire-section"
              className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl"
            >
              양성화의 장점과 확실한 절차
            </h2>
            <p className="mt-4 text-base text-slate-700 dark:text-slate-200">
              30년 노하우로 진행되는 맞춤 컨설팅과 함께 합법화의 모든 과정을 한 번에 해결하세요.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {desireItems.map((item) => (
              <InfoCard key={item.title} icon={<span>{item.icon}</span>} title={item.title} description={item.description} />
            ))}
          </div>
          <div className="mt-16 space-y-6">
            <h3 className="text-center text-2xl font-semibold text-slate-900 dark:text-slate-100">
              양성화 절차 타임라인
            </h3>
            <Timeline steps={timelineSteps} />
          </div>
        </div>
      </section>

      {/* Action */}
      <section
        className="relative isolate overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
        aria-labelledby="action-section"
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[2fr,1fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-foreground opacity-80">Action</p>
              <h2 id="action-section" className="text-4xl font-bold">
                무허가·위반 건축물 양성화, 마지막 기회!
              </h2>
              <p className="text-lg text-primary-foreground opacity-80">
                30년 전문가와 함께 안전하게 합법화 하세요. 빠른 대응이 합법화 성공을 결정합니다.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <CTAButton
                  tone="secondary"
                  className="sm:w-auto hover:bg-[#ffeb00] hover:text-black focus-visible:ring-[#ffeb00]"
                  onClick={() => setModalOpen(true)}
                >
                  카카오톡 문의하기
                </CTAButton>
                <CTAButton
                  tone="secondary"
                  className="sm:w-auto hover:bg-[#ffeb00] hover:text-black focus-visible:ring-[#ffeb00]"
                  onClick={() => setModalOpen(true)}
                >
                  문의 남기기
                </CTAButton>
              </div>
            </div>
              <div className="space-y-4 rounded-2xl border border-primary-foreground bg-primary-foreground p-8 text-sm border-opacity-20 bg-opacity-10 text-black dark:text-black">
                <div>
                  <p className="font-semibold uppercase tracking-wide opacity-70">Contact</p>
                  <p className="mt-1 text-base font-medium">
                    ㈜인터월드엔지니어링 건축사사무소
                  </p>
                </div>
                <div className="space-y-2 opacity-80">
                  <p>문의전화: </p>
                  <p>
                    <a href="tel:01073323815" className="font-semibold hover:underline">
                      010-7332-3815
                    </a>
                    <span className="px-1">/</span>
                    <a href="tel:0263481009" className="font-semibold hover:underline">
                      02-6348-1009
                    </a>
                  </p>
                </div>
            </div>
          </div>
        </div>
      </section>
      <style jsx>{`
        @keyframes scroll-indicator {
          0% {
            transform: translateY(0);
            opacity: 0.55;
          }
          50% {
            transform: translateY(10px);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 0.55;
          }
        }
      `}</style>
    </div>
  );
}
