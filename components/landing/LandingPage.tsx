'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode
} from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowBigDownDash,
  ArrowBigUpDash,
  Bell,
  BookUp,
  Building2,
  CheckLine,
  Handshake,
  Landmark,
  Megaphone,
  MessageCircleMore,
  Menu,
  PenLine,
  Phone,
  PhoneCall,
  Search,
  ShieldCheck,
  UserRoundCog,
  Newspaper,
  MapPinned
} from 'lucide-react';
import { SiteFooter } from '../layout/SiteFooter';
import { CTAButton } from '../ui/cta-button';
import { ThemeToggle } from '../ui/theme-toggle';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { ConsultationModal } from './ConsultationModal';
import { AboutModal } from './AboutModal';
import { LoginModal } from './LoginModal';
import { InfoCard } from './InfoCard';
import { Timeline } from './Timeline';
import { FAQAccordion } from './FAQAccordion';
import { handleUserLogout } from '@/lib/auth/logout';
import { AuthButton } from './AuthButton';
import { CONTACTS } from '@/lib/constants/contacts';
import {
  interestItems,
  desireItems,
  timelineItems,
  fullFaqs,
  featuredFaqs
} from '@/lib/constants/landingPageData';

type NavigationItem =
  | { label: string; type: 'modal'; icon?: ReactNode; requiresAuth?: boolean }
  | { label: string; type: 'link'; href: string; icon?: ReactNode; requiresAuth?: boolean }
  | { label: string; type: 'anchor'; target: string; icon?: ReactNode; requiresAuth?: boolean }
  | { label: string; type: 'notification'; icon?: ReactNode; requiresAuth?: boolean };

type PaymentNoticeItem = {
  address: string;
  count: number;
  latestAt: string | null;
};

const navigationItems: NavigationItem[] = [
  {
    label: '우리의 역할',
    type: 'modal',
    icon: <ShieldCheck className="h-6 w-6 lg:h-4 lg:w-4" aria-hidden />
  },
  {
    label: '3D 위반사례',
    type: 'link',
    href: '/qna',
    icon: <Building2 className="h-6 w-6 lg:h-4 lg:w-4" aria-hidden />
  },
  {
    label: '지역별 현황',
    type: 'link',
    href: '/region',
    icon: <MapPinned className="h-6 w-6 lg:h-4 lg:w-4" aria-hidden />
  },
  {
    label: '핵심정리',
    type: 'link',
    href: '/card-news',
    icon: <BookUp className="h-6 w-6 lg:h-4 lg:w-4" aria-hidden />
  },
  {
    label: '캠페인',
    type: 'link',
    href: '/campaign',
    icon: <Megaphone className="h-6 w-6 lg:h-4 lg:w-4" aria-hidden />
  },
  {
    label: '언론보도',
    type: 'link',
    href: '/press',
    icon: <Newspaper className="h-6 w-6 lg:h-4 lg:w-4" aria-hidden />
  },
  {
    label: '마이페이지',
    type: 'link',
    href: '/mypage',
    icon: <UserRoundCog className="h-4 w-4" aria-hidden />,
    requiresAuth: true
  },
  {
    label: '결제 알림',
    type: 'notification',
    icon: <Bell className="h-4 w-4" aria-hidden />,
    requiresAuth: true
  }
];

type DesireIconKey = (typeof desireItems)[number]['icon'];
type TimelineIconKey = (typeof timelineItems)[number]['icon'];

// TODO(daily-notice): Remove once service notice popup is no longer needed.
const DAILY_NOTICE_STORAGE_KEY = 'archlegal:daily-notice-dismissed-date';

const getTodayKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const renderDesireIcon = (type: DesireIconKey) => {
  switch (type) {
    case 'down':
      return <ArrowBigDownDash className="h-8 w-8" aria-hidden />;
    case 'up':
      return <ArrowBigUpDash className="h-8 w-8" aria-hidden />;
    case 'handshake':
      return <Handshake className="h-8 w-8" aria-hidden />;
    case 'shield':
      return <ShieldCheck className="h-8 w-8" aria-hidden />;
    default:
      return <ArrowBigUpDash className="h-8 w-8" aria-hidden />;
  }
};

const renderTimelineIcon = (type: TimelineIconKey) => {
  switch (type) {
    case 'message-circle-more':
      return <MessageCircleMore className="h-6 w-6" aria-hidden />;
    case 'pen-line':
      return <PenLine className="h-6 w-6" aria-hidden />;
    case 'search':
      return <Search className="h-6 w-6" aria-hidden />;
    case 'landmark':
      return <Landmark className="h-6 w-6" aria-hidden />;
    case 'book-up':
      return <BookUp className="h-6 w-6" aria-hidden />;
    case 'check-line':
      return <CheckLine className="h-6 w-6" aria-hidden />;
    case 'arrow-big-up-dash':
      return <ArrowBigUpDash className="h-6 w-6" aria-hidden />;
    default:
      return <ArrowBigUpDash className="h-6 w-6" aria-hidden />;
  }
};

export function LandingPage({ kickSlot }: { kickSlot?: ReactNode } = {}) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [consultationNextPath, setConsultationNextPath] = useState('/?consultation=open');
  const [consultationInitialMessage, setConsultationInitialMessage] = useState('');
  const [consultationInitialAddress, setConsultationInitialAddress] = useState<import('@/lib/validations/consultation').AddressSearchResult | null>(null);
  const [consultationInitialAddressDetail, setConsultationInitialAddressDetail] = useState('');
  const [isAboutModalOpen, setAboutModalOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  // TODO(daily-notice): Remove once service notice popup is no longer needed.
  const [isNoticeOpen, setNoticeOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [isNavOpen, setNavOpen] = useState(false);
  const [isPaymentNoticeOpen, setPaymentNoticeOpen] = useState(false);
  const [paymentNoticeItems, setPaymentNoticeItems] = useState<PaymentNoticeItem[]>([]);
  const [paymentNoticeOverflow, setPaymentNoticeOverflow] = useState(0);
  const [paymentNoticeError, setPaymentNoticeError] = useState<string | null>(null);
  const supabase = useSupabaseClient();
  const router = useRouter();
  // TODO(daily-notice): Remove once service notice popup is no longer needed.
  const isDailyNoticeEnabled = process.env.NEXT_PUBLIC_DAILY_NOTICE_ENABLED === 'true';

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

  useEffect(() => {
    let cancelled = false;

    const loadPaymentPreview = async () => {
      if (!sessionUser) {
        setPaymentNoticeItems([]);
        setPaymentNoticeOverflow(0);
        setPaymentNoticeError(null);
        return;
      }

      try {
        const response = await fetch('/api/payments/stages', { credentials: 'include' });
        if (!response.ok) {
          throw new Error('결제 정보를 불러오지 못했습니다.');
        }
        const json = await response.json();

        const consultations: Array<{
          consultation?: { address?: string | null };
          stages?: Array<{ status?: string; requestedAt?: string | null; updatedAt?: string | null; paidAt?: string | null }>;
        }> = json?.consultationsWithStages ?? [];

        const pending: PaymentNoticeItem[] = consultations
          .reduce<PaymentNoticeItem[]>((acc, item) => {
            const address = item.consultation?.address ?? '주소 미입력';
            const stages = (item.stages ?? []).filter(
              stage => stage.status !== 'paid' && stage.status !== 'canceled'
            );
            if (!stages.length) {
              return acc;
            }
            const latestAt =
              stages
                .map(stage => stage.requestedAt ?? stage.updatedAt ?? stage.paidAt ?? null)
                .filter((v): v is string => Boolean(v))
                .sort((a, b) => (a > b ? -1 : 1))[0] ?? null;
            acc.push({ address, count: stages.length, latestAt });
            return acc;
          }, [])
          .sort((a, b) => {
            if (a.latestAt && b.latestAt) {
              return a.latestAt > b.latestAt ? -1 : 1;
            }
            if (a.latestAt) return -1;
            if (b.latestAt) return 1;
            return 0;
          });

        if (!cancelled) {
          setPaymentNoticeItems(pending.slice(0, 3));
          setPaymentNoticeOverflow(Math.max(pending.length - 3, 0));
          setPaymentNoticeError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setPaymentNoticeItems([]);
          setPaymentNoticeOverflow(0);
          setPaymentNoticeError('결제 내역을 불러오지 못했습니다.');
        }
      }
    };

    loadPaymentPreview();

    return () => {
      cancelled = true;
    };
  }, [sessionUser]);

  const handleLogout = useCallback(async () => {
    setSessionUser(null);
    setLoginModalOpen(false);
    await handleUserLogout(router);
  }, [router]);

  const openConsultationModal = useCallback(() => {
    if (typeof window !== 'undefined') {
      setConsultationNextPath(`${window.location.pathname}?consultation=open`);
    }
    setModalOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    let shouldCleanUrl = false;

    const authErrorCode = url.searchParams.get('auth_error');
    if (authErrorCode) {
      setAuthError(authErrorCode);
      setLoginModalOpen(true);
      url.searchParams.delete('auth_error');
      shouldCleanUrl = true;
    }

    if (url.searchParams.get('consultation') === 'open') {
      setConsultationNextPath(`${url.pathname}?consultation=open`);
      try {
        const stored = window.sessionStorage.getItem('calc_consultation_prefill');
        if (stored) {
          const prefill = JSON.parse(stored) as { address?: unknown; addressDetail?: string; message?: string };
          if (prefill.message) setConsultationInitialMessage(prefill.message);
          if (prefill.address) setConsultationInitialAddress(prefill.address as import('@/lib/validations/consultation').AddressSearchResult);
          if (prefill.addressDetail) setConsultationInitialAddressDetail(prefill.addressDetail);
          window.sessionStorage.removeItem('calc_consultation_prefill');
        }
      } catch {}
      setModalOpen(true);
      url.searchParams.delete('consultation');
      shouldCleanUrl = true;
    }

    if (shouldCleanUrl) {
      const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, '', cleanUrl || '/');
    }
  }, []);

  useEffect(() => {
    // TODO(daily-notice): Remove once service notice popup is no longer needed.
    if (typeof window === 'undefined' || !isDailyNoticeEnabled) {
      return;
    }

    try {
      const storedDate = window.localStorage.getItem(DAILY_NOTICE_STORAGE_KEY);
      const todayKey = getTodayKey();
      if (storedDate !== todayKey) {
        setNoticeOpen(true);
      }
    } catch {
      setNoticeOpen(true);
    }
  }, [isDailyNoticeEnabled]);


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

  const handleHideNoticeToday = useCallback(() => {
    // TODO(daily-notice): Remove once service notice popup is no longer needed.
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(DAILY_NOTICE_STORAGE_KEY, getTodayKey());
      } catch {
        // Ignore storage failures — popup will reappear on next load.
      }
    }
    setNoticeOpen(false);
  }, []);

  const handleCloseNotice = useCallback(() => {
    // TODO(daily-notice): Remove once service notice popup is no longer needed.
    setNoticeOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-200">
      <ConsultationModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        nextPath={consultationNextPath}
        initialMessage={consultationInitialMessage}
        initialAddress={consultationInitialAddress}
        initialAddressDetail={consultationInitialAddressDetail}
      />
      <LoginModal
        open={isLoginModalOpen}
        onClose={() => {
          setLoginModalOpen(false);
          setAuthError(null);
        }}
        authError={authError}
      />
      <AboutModal open={isAboutModalOpen} onClose={() => setAboutModalOpen(false)} faqs={fullFaqs} />
      {isNoticeOpen ? (
        // TODO(daily-notice): Remove once service notice popup is no longer needed.
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl border border-border bg-background/95 p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-semibold text-foreground">서비스 이용 안내</h2>
            <div className="mt-4 space-y-2 text-left text-sm leading-6 text-muted-foreground">
              <p>ArchLegal 찾아 주셔서 감사합니다.</p>
              <p>현재 회원가입 및 상담내역 신청은 준비 중이며 11월 중순부터 순차적으로 이용하실 수 있습니다.</p>
              <p>조금만 더 기다려 주시면 최선을 다해 준비한 모습으로 인사드리겠습니다.</p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <CTAButton type="button" className="flex-1" onClick={handleHideNoticeToday}>
                오늘 하루 보지 않기
              </CTAButton>
              <CTAButton
                type="button"
                tone="secondary"
                className="flex-1"
                onClick={handleCloseNotice}
              >
                닫기
              </CTAButton>
            </div>
          </div>
        </div>
      ) : null}

      {/* Attention */}
      <section
        className="relative isolate overflow-hidden bg-slate-900/50 text-white"
        aria-labelledby="attention-section"
      >
        <Image
          src="/hero.png"
          alt="양성화.com 위반건축물과 불법건축물 양성화 상담 서비스를 소개하는 건축물 이미지"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-slate-900/15" />
        <header className="absolute inset-x-0 top-0 z-20 bg-slate-950/30 pb-4 pt-6 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
            <a
              href="#attention-section"
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-white/70 transition hover:text-white"
            >
              <Image src="/docu/logo.png" alt="" width={28} height={28} aria-hidden="true" />
              <span>양성화.com</span>
            </a>
            <div className="flex items-center gap-3">
              <nav className="hidden items-center gap-6 text-base font-medium text-white/80 lg:flex">
                {navigationItems.map(item => {
                  if (item.requiresAuth && !sessionUser) {
                    return null;
                  }
                  const icon = item.icon;
                  if (item.type === 'modal') {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setAboutModalOpen(true)}
                        className="flex items-center gap-2 bg-transparent transition hover:text-white focus:outline-none"
                      >
                        {icon}
                        <span>{item.label}</span>
                      </button>
                    );
                  }
                  if (item.type === 'link') {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2 transition hover:text-white"
                      >
                        {icon}
                        <span>{item.label}</span>
                      </Link>
                    );
                  }
                  if (item.type === 'notification') {
                    return (
                      <div
                        key={item.label}
                        className="relative flex items-center"
                        onMouseEnter={() => setPaymentNoticeOpen(true)}
                        onMouseLeave={() => setPaymentNoticeOpen(false)}
                      >
                        <Link
                          href="/mypage/payments"
                          className="flex items-center gap-1 p-0 text-white opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.65)] transition hover:text-white"
                          aria-label="결제 알림"
                        >
                          {icon}
                          {paymentNoticeItems.length > 0 || paymentNoticeOverflow > 0 ? (
                            <span className="text-sm">
                              ({paymentNoticeItems.reduce((sum, item) => sum + item.count, 0) + paymentNoticeOverflow})
                            </span>
                          ) : null}
                        </Link>
                        {isPaymentNoticeOpen ? (
                          <div className="absolute right-0 top-11 w-64 rounded-xl border border-white/15 bg-slate-900/90 p-3 text-sm text-white shadow-lg backdrop-blur">
                            {paymentNoticeError ? (
                              <p className="font-semibold">{paymentNoticeError}</p>
                            ) : paymentNoticeItems.length ? (
                              <div className="space-y-2">
                                {paymentNoticeItems.map((item, index) => (
                                  <div key={`${item.address}-${index}`} className="space-y-0.5">
                                    <p className="font-semibold leading-tight">{item.address}</p>
                                    <p className="text-xs text-white/70 leading-tight">결제 {item.count}건 대기</p>
                                  </div>
                                ))}
                                {paymentNoticeOverflow > 0 ? (
                                  <p className="text-xs text-white/60">외 {paymentNoticeOverflow}건 대기 중</p>
                                ) : null}
                                <p className="text-xs text-white/70">클릭하면 결제 내역으로 이동합니다.</p>
                              </div>
                            ) : (
                              <>
                                <p className="font-semibold">결제 내역이 없습니다.</p>
                                <p className="mt-1 text-xs text-white/70">클릭하면 결제 내역으로 이동합니다.</p>
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  }
                  return (
                    <a
                      key={item.target}
                      href={`#${item.target}`}
                      onClick={event => handleSectionNavigate(event, item.target)}
                      className="flex items-center gap-2 transition hover:text-white"
                    >
                      {icon}
                      <span>{item.label}</span>
                    </a>
                  );
                })}
                <AuthButton
                  sessionUser={sessionUser}
                  size="desktop"
                  onLogin={() => setLoginModalOpen(true)}
                  onLogout={handleLogout}
                />
                <ThemeToggle />
              </nav>
              <div className="flex items-center gap-2 lg:hidden">
                <AuthButton
                  sessionUser={sessionUser}
                  size="mobile"
                  onLogin={() => setLoginModalOpen(true)}
                  onLogout={handleLogout}
                />
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
                  <SheetContent
                    aria-describedby={undefined}
                    className="flex h-auto max-h-[calc(100vh-200px)] flex-col bg-background text-foreground top-24 bottom-24 rounded-l-3xl"
                  >
                    <SheetHeader className="sr-only">
                      <SheetTitle>모바일 내비게이션</SheetTitle>
                    </SheetHeader>
                    <nav className="mt-10 flex flex-col gap-6 text-lg font-medium">
                      {navigationItems.map(item => {
                        if (item.requiresAuth && !sessionUser) {
                          return null;
                        }
                        const icon = item.icon;
                        if (item.type === 'modal') {
                          return (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => {
                                setAboutModalOpen(true);
                                setNavOpen(false);
                              }}
                              className="flex items-center gap-3 bg-transparent text-left transition hover:text-primary focus:outline-none"
                            >
                              {icon ?? <ShieldCheck className="h-6 w-6 lg:h-4 lg:w-4" aria-hidden />}
                              <span>{item.label}</span>
                            </button>
                          );
                        }
                        if (item.type === 'link') {
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setNavOpen(false)}
                              className="flex items-center gap-3 transition hover:text-primary"
                            >
                              {icon ?? <Newspaper className="h-6 w-6 lg:h-4 lg:w-4" aria-hidden />}
                              <span>{item.label}</span>
                            </Link>
                          );
                        }
                        if (item.type === 'notification') {
                          const totalCount = paymentNoticeItems.reduce((sum, item) => sum + item.count, 0) + paymentNoticeOverflow;
                          return (
                            <Link
                              key={item.label}
                              href="/mypage/payments"
                              onClick={() => setNavOpen(false)}
                              className="flex items-center gap-3 transition hover:text-primary"
                            >
                              {icon ?? <Bell className="h-6 w-6" aria-hidden />}
                              <span>
                                {item.label}
                                {totalCount > 0 ? ` (${totalCount})` : ''}
                              </span>
                            </Link>
                          );
                        }
                        return (
                          <a
                            key={item.target}
                            href={`#${item.target}`}
                            onClick={event => handleSectionNavigate(event, item.target)}
                            className="flex items-center gap-3 transition hover:text-primary"
                          >
                            {icon}
                            <span>{item.label}</span>
                          </a>
                        );
                      })}
                      <div className="mt-8 space-y-4 border-t border-border pt-6">
                        <button
                          type="button"
                          onClick={() => {
                            openConsultationModal();
                            setNavOpen(false);
                          }}
                          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                        >
                          무료 상담 신청
                        </button>
                        <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                          <Phone className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">추가 문의가 필요하신가요?</p>
                            <a href={`tel:${CONTACTS.officeRaw}`} className="text-foreground text-base font-semibold">
                              {CONTACTS.office}
                            </a>
                            <p className="text-xs">평일 09:00-18:00 상담팀에서 신속히 도와드립니다.</p>
                          </div>
                        </div>
                      </div>
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
              법률 제21820호 · 2026.12.17 시행
            </p>
            <h1 id="attention-section" className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              양성화, 이제 ‘법’으로 길이 열렸습니다
            </h1>
            <p className="text-lg text-primary-foreground opacity-80 sm:text-xl">
              「특정건축물 정리에 관한 특별조치법」이 2026년 6월 16일 제정·공포되어 12월 17일 시행됩니다.
              <br className="hidden sm:block" />
              시행일부터 18개월 한시 — 지금 준비를 시작해야 안전하게 합법화할 수 있습니다.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <CTAButton className="sm:w-auto" onClick={openConsultationModal}>
                무료 상담 신청
              </CTAButton>
              <CTAButton tone="secondary" className="sm:w-auto" asChild>
                <Link href="/check" target="_blank" rel="noopener noreferrer">
                  자가진단 하기
                </Link>
              </CTAButton>
              {/* <CTAButton tone="secondary" className="sm:w-auto" asChild>
                <Link href="/calc" target="_blank" rel="noopener noreferrer">
                  이행강제금 계산하기
                </Link>
              </CTAButton> */}
              <CTAButton tone="secondary" className="sm:w-auto" asChild>
                <Link href="/procedure">절차 보기</Link>
              </CTAButton>
            </div>
          </div>
          <div className="flex-1">
            <div className="rounded-3xl border border-white bg-white/10 p-8 shadow-2xl backdrop-blur">
              <h2 className="text-xl font-semibold text-white">필수 일정 요약</h2>
              <dl className="mt-6 grid grid-cols-1 gap-4 text-sm text-slate-100 sm:grid-cols-2">
                {interestItems.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white bg-white/10 p-4">
                    <dt className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-100">{item.title}</dt>
                    <dd className="mt-2 text-xl font-semibold text-white">{item.highlight}</dd>
                    <p className="mt-2 text-sm text-white/90">{item.description}</p>
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

      {/* home-v2 실험용 슬롯: 라이브 /는 미전달이라 렌더 안 됨 */}
      {kickSlot}

      {/* Interest */}
      <section
        className="relative isolate overflow-hidden border-y border-primary/10 bg-secondary py-20 transition-colors duration-200 dark:border-primary/20 dark:bg-secondary"
        aria-labelledby="interest-section"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/15 via-white to-transparent dark:from-primary/25 dark:via-slate-900/80 dark:to-slate-950" />
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="max-w-3xl space-y-4">
            <h2 id="interest-section" className="text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
              법 시행 안내 & 소요 기간
            </h2>
            <p className="text-base text-slate-700 dark:text-slate-200 md:whitespace-nowrap">
              특별법 시행 기간은 단 18개월(2026.12.17~2028.6.16)입니다. 건축위원회 심의 일정까지 고려하면 지금 바로 준비해야
              여유롭게 절차를 마칠 수 있습니다.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm shadow-primary/10 lg:col-span-1">
              <h3 className="text-lg font-semibold text-foreground">건축위원회 심의</h3>
              <p className="mt-2 text-3xl font-bold text-primary">1~2개월</p>
              <p className="mt-3 text-sm text-muted-foreground">
                제출 서류 검토와 현장 점검까지 평균 4–8주가 소요됩니다.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm shadow-primary/10 lg:col-span-1">
              <h3 className="text-lg font-semibold text-foreground">전체 완료</h3>
              <p className="mt-2 text-3xl font-bold text-primary">2~3개월</p>
              <p className="mt-3 text-sm text-muted-foreground">
                최종 사용 승인까지 고려하면 최소 8주 이상을 확보해야 안전합니다.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-accent p-6 lg:col-span-1">
              <p className="text-lg font-semibold text-accent-foreground">전국 위반 현황 (2024.12)</p>
              <ul className="mt-3 space-y-2 text-sm text-accent-foreground/90">
                <li>• 총 147,726동 중 주거용이 56.5%, 연평균 5~6천 동씩 증가</li>
                <li>• 서울 49,011동(33.2%), 경기 40,908동(27.7%)에 집중 발생</li>
                <li>• 이행강제금은 건당 141만 원, 시정 시까지 반복·가중 부과</li>
              </ul>
              <p className="mt-4 text-sm font-medium text-accent-foreground/90">
                초기 진단과 서류 준비를 선제적으로 진행해야 비용과 시간을 줄일 수 있습니다.
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
            <h2
              id="desire-section"
              className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl"
            >
              양성화의 장점과 확실한 절차
            </h2>
            <p className="mt-4 text-base text-slate-700 dark:text-slate-200">
              ArchLegal은 합법적 해결과 신뢰 기반의 양성화 해결 서비스를 제공하는<br className="hidden sm:inline" />
              대한민국 양성화 전문 솔루션 플랫폼입니다.
            </p>
            <p className="mt-2 text-base text-slate-700 dark:text-slate-200">
              30년 노하우로 진행되는 맞춤 컨설팅과 함께 합법화의 모든 과정을 한 번에 해결하세요.

            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {desireItems.map((item) => (
              <InfoCard
                key={item.title}
                icon={renderDesireIcon(item.icon)}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
          <div className="mt-16 space-y-6">
            <h3 className="text-center text-2xl font-semibold text-slate-900 dark:text-slate-100">
              양성화 절차 타임라인
            </h3>
            <Timeline
              steps={timelineItems.map((item) => ({
                ...item,
                icon: renderTimelineIcon(item.icon)
              }))}
            />
            <p className="text-center text-sm text-slate-600 dark:text-slate-300">
              최근 실태조사에서는 발코니·베란다 확장이 42.2%, 옥상 증축이 31.4%를 차지했습니다. 주요
              위반 유형을 정확히 짚어 맞춤 전략을 세우는 것이 성공의 핵심입니다.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        className="relative isolate overflow-hidden border-y border-primary/10 bg-muted/30 py-20 transition-colors duration-200 dark:border-primary/20 dark:bg-slate-900/60"
        aria-labelledby="faq-section"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-transparent to-transparent dark:from-primary/20" />
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="faq-section" className="text-3xl font-bold text-foreground sm:text-4xl">
              자주 묻는 질문
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              위반건축물 양성화 과정에서 가장 많이 받는 질문과 답변을 먼저 확인하세요.
            </p>
          </div>
          <div className="mt-10">
            <FAQAccordion items={featuredFaqs} />
          </div>
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setAboutModalOpen(true)}
              className="text-sm font-semibold text-primary underline-offset-4 transition hover:underline"
            >
              더 많은 질문 보기
            </button>
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
              <h2 id="action-section" className="text-4xl font-bold">
                무허가·위반 건축물 양성화, 마지막 기회!
              </h2>
              <p className="text-lg text-primary-foreground opacity-80">
                30년 전문가와 함께 안전하게 합법화 하세요. 이행강제금 반복 부과, 공인중개사 건축물대장
                제시 의무화 등 강화되는 규제 속에서 선제적 대응이 합법화 성공을 좌우합니다.

              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                
                <CTAButton
                  tone="secondary"
                  className="sm:w-auto hover:bg-[#ffeb00] hover:text-black focus-visible:ring-[#ffeb00]"
                  onClick={openConsultationModal}
                >
                  문의 남기기
                </CTAButton>
              </div>
            </div>
              <div className="space-y-4 rounded-2xl border border-primary-foreground bg-primary-foreground p-8 text-sm border-opacity-20 bg-opacity-10 text-black dark:text-black">
                <div>
                  <p className="font-semibold uppercase tracking-wide opacity-70">Contact</p>
                  <p className="mt-1 text-base font-medium">
                    {CONTACTS.company}
                  </p>
                </div>
                <div className="space-y-2 opacity-80">
                  <p>문의전화: </p>
                  <p className="flex items-center gap-2">
                    <PhoneCall className="h-5 w-5 opacity-70" aria-hidden />
                    <a href={`tel:${CONTACTS.mobileRaw}`} className="font-semibold hover:underline">
                      {CONTACTS.mobile}
                    </a>
                    <span className="px-1">/</span>
                    <a href={`tel:${CONTACTS.officeRaw}`} className="font-semibold hover:underline">
                      {CONTACTS.office}
                    </a>
                  </p>
                </div>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
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
