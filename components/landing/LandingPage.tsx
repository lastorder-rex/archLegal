'use client';

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu } from 'lucide-react';
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

const interestItems = [
  {
    title: '시행 기간',
    highlight: '2026년 한시 시행 (예정)',
    description: '정부 계획안에 따르면 1년 한시 시행이 추진됩니다. 기간 내 신청을 준비해야 합니다.'
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

const timelineItems = [
  {
    icon: '💬',
    title: '무료상담',
    description: '이행강제금 부과 이력과 위반 유형을 분석해 합법화 가능성을 진단합니다.'
  },
  {
    icon: '🗂️',
    title: '신고서 작성',
    description: '건축물대장, 구조 검토, 감경자료를 한 번에 준비하여 접수 리드를 확보합니다.'
  },
  {
    icon: '🔍',
    title: '현장조사',
    description: '발코니 확장·옥상 증축 등 위반 비중이 높은 부분을 중심으로 실측 및 사진 보고서를 작성합니다.'
  },
  {
    icon: '🏛️',
    title: '위원회 심의',
    description: '지자체 TF와 협의해 4–8주 소요되는 건축위원회 심의를 통과하도록 전략을 수립합니다.'
  },
  {
    icon: '📑',
    title: '건축물대장 등재',
    description: '특별조치법 특례를 적용해 서류 보완을 마무리하고 합법 건축물로 등록합니다.'
  },
  {
    icon: '✅',
    title: '사용승인',
    description: '사용승인 취득 후 준공 직후 재위반 방지를 위한 관리 매뉴얼을 제공합니다.'
  },
  {
    icon: '📈',
    title: '재산가치 상승',
    description: '금융 거래와 매매가 정상화되어 안정적인 수익 구조와 재산권을 확보합니다.'
  }
];

const fullFaqs = [
  {
    question: '위반건축물이란 정확히 무엇인가요?',
    answer:
      '건축법에 따른 허가(또는 신고) 없이 건축·대수선·용도변경을 하거나 일조, 건축선, 구조, 피난, 방화, 조경 기준을 위반한 건축물을 말합니다. 베란다 확장, 옥상 불법 증축, 방 쪼개기, 근생 시설을 주택으로 바꾸는 행위 등이 대표 사례입니다.'
  },
  {
    question: '위반건축물이 되면 어떤 불이익이 있나요?',
    answer:
      '지자체의 시정명령 및 원상복구 명령이 내려집니다. 평균 건당 141만 원 수준의 이행강제금이 반복 부과될 수 있으며, 매매·임대차 시 대출 제한이나 보증보험 가입 불가 등 거래 제한이 생기고 구조적 불안정, 화재 등 안전 위험도 커집니다.'
  },
  {
    question: '이행강제금은 얼마나 내야 하나요?',
    answer:
      '2024년 기준 평균 건당 141만 원이며 매년 반복 부과될 수 있습니다. 소규모 위반 등 일부 조건에서는 최대 75%까지 감경할 수 있지만, 장기적으로는 원상복구 비용이 더 클 수 있어 선제적인 양성화가 필요합니다.'
  },
  {
    question: '위반건축물을 사고팔 때 어떤 문제가 생기나요?',
    answer:
      '매도인이 불법시공을 했더라도 매수인이 적발되면 이행강제금을 납부해야 합니다. 위반 사실이 등재되지 않은 상태로 계약을 진행하면 대출이 막히거나 전세금 피해가 생길 수 있어 건축물대장 확인과 원상복구 책임 특약이 필수입니다.'
  },
  {
    question: '정부에서 양성화 기회를 주나요?',
    answer:
      '2026년 시행 예정인 「특정건축물 정리 특별조치법」을 통해 일정 규모 이하 주거용 건축물은 한시적으로 합법 전환을 신청할 수 있습니다. 단독 165㎡, 다가구 330㎡, 다세대 세대당 85㎡ 이하 대상이며 구조 안전, 위생, 방화, 일조권 심사를 통과해야 합니다.'
  },
  {
    question: '앞으로 단속은 더 강화되나요?',
    answer:
      '정부는 AI 기반 항공사진 분석으로 전국 건축물 변화를 자동 추적하고, 지자체 실태조사를 의무화할 계획입니다. 이행강제금도 반복·가중 부과가 강화돼 “적발되지 않을 것”이라는 기대가 점점 어려워지고 있습니다.'
  },
  {
    question: '위반건축물을 소유한 저는 지금 무엇을 해야 하나요?',
    answer:
      '먼저 건축물대장을 확인해 위반 여부를 파악하고, 전문가 상담으로 구조 안전과 복구 가능성을 점검해야 합니다. 2026년 특별법 시행에 맞춰 합법화 신청을 준비하고, 매매·임대차 시 특약 삽입과 안전 점검으로 피해를 예방하세요.'
  }
];

const featuredFaqs = fullFaqs.slice(0, 4);

type NavigationItem =
  | { label: string; type: 'modal' }
  | { label: string; type: 'anchor'; target: string };

const navigationItems: NavigationItem[] = [{ label: '우리의 역할', type: 'modal' as const }];

export function LandingPage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isAboutModalOpen, setAboutModalOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [isNavOpen, setNavOpen] = useState(false);
  const supabase = createClientComponentClient();
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
    setSessionUser(null);
    setLoginModalOpen(false);
    await handleUserLogout(router);
  }, [router]);

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


  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-200">
      <ConsultationModal open={isModalOpen} onClose={() => setModalOpen(false)} />
      <LoginModal open={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
      <AboutModal open={isAboutModalOpen} onClose={() => setAboutModalOpen(false)} faqs={fullFaqs} />

      {/* Attention */}
      <section
        className="relative isolate overflow-hidden bg-slate-900/50 text-white"
        aria-labelledby="attention-section"
      >
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(24,24,27,0.15), rgba(24,24,27,0.15)), url('/hero.png')",
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
                {navigationItems.map(({ label, type, target }) =>
                  type === 'modal' ? (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setAboutModalOpen(true)}
                      className="bg-transparent transition hover:text-white focus:outline-none"
                    >
                      {label}
                    </button>
                  ) : (
                    <a
                      key={target}
                      href={`#${target}`}
                      onClick={(event) => handleSectionNavigate(event, target)}
                      className="transition hover:text-white"
                    >
                      {label}
                    </a>
                  )
                )}
                {sessionUser ? (
                  <Link href="/mypage" className="transition hover:text-white">
                    마이페이지
                  </Link>
                ) : null}
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
                  <SheetContent aria-describedby={undefined} className="flex flex-col bg-background text-foreground">
                    <SheetHeader className="sr-only">
                      <SheetTitle>모바일 내비게이션</SheetTitle>
                    </SheetHeader>
                    <nav className="mt-10 flex flex-col gap-6 text-base font-medium">
                      {navigationItems.map(({ label, type, target }) =>
                        type === 'modal' ? (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              setAboutModalOpen(true);
                              setNavOpen(false);
                            }}
                            className="bg-transparent text-left transition hover:text-primary focus:outline-none"
                          >
                            {label}
                          </button>
                        ) : (
                          <a
                            key={target}
                            href={`#${target}`}
                            onClick={(event) => handleSectionNavigate(event, target)}
                            className="transition hover:text-primary"
                          >
                            {label}
                          </a>
                        )
                      )}
                      {sessionUser ? (
                        <Link
                          href="/mypage"
                          onClick={() => setNavOpen(false)}
                          className="transition hover:text-primary"
                        >
                          마이페이지
                        </Link>
                      ) : null}
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
              Special Act 2026
            </p>
            <h1 id="attention-section" className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              특정건축물 정리에 관한 특별법 안내
            </h1>
            <p className="text-lg text-primary-foreground opacity-80 sm:text-xl">
              2026년 특정건축물 정리 특별조치법이 1년 한시 시행을 목표로 준비되고 있습니다.
              <br className="hidden sm:block" />
              지금 준비를 시작해야 안전하게 합법화할 수 있습니다.
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
            <p className="text-base text-slate-700 dark:text-slate-200">
              특별법 시행 기간은 단 1년입니다. 건축위원회 심의 일정까지 고려하면 지금 바로 준비해야
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
              <p className="text-sm font-semibold text-accent-foreground">전국 위반 현황 (2024.12)</p>
              <ul className="mt-3 space-y-2 text-sm text-accent-foreground/90">
                <li>• 총 147,726동 중 주거용이 56.5%, 연평균 5~6천 동씩 증가</li>
                <li>• 서울 49,011동(33.2%), 경기 40,908동(27.7%)에 집중 발생</li>
                <li>• 이행강제금은 건당 141만 원, 반복 부과 의무화 추진 중</li>
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
            <Timeline steps={timelineItems} />
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
