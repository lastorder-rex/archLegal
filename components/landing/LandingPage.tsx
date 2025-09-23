'use client';

import { useState } from 'react';
import { CTAButton } from '../ui/cta-button';
import { ConsultationModal } from './ConsultationModal';
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

export function LandingPage() {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-200">
      <ConsultationModal open={isModalOpen} onClose={() => setModalOpen(false)} />

      {/* Attention */}
      <section className="relative isolate overflow-hidden bg-slate-900 text-white" aria-labelledby="attention-section">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(24,24,27,0.35), rgba(24,24,27,0.35)), url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-24 sm:py-32 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1 space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-foreground opacity-70">
              Special Act 2025
            </p>
            <h1 id="attention-section" className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              특정건축물 정리에 관한 특별법 안내
            </h1>
            <p className="text-lg text-primary-foreground opacity-80 sm:text-xl">
              2025년 특정건축물 정리에 관한 특별 조치법 시행 – 단 1년의 기회! 지금 준비를 시작해야
              안전하게 합법화할 수 있습니다.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <CTAButton className="sm:w-auto" onClick={() => setModalOpen(true)}>
                무료 상담 신청
              </CTAButton>
              <CTAButton tone="secondary" className="sm:w-auto" onClick={() => setModalOpen(true)}>
                절차 자세히 보기
              </CTAButton>
            </div>
          </div>
          <div className="flex-1">
            <div className="rounded-3xl border border-white/30 bg-white/10 p-8 shadow-2xl backdrop-blur">
              <h2 className="text-xl font-semibold text-white">필수 일정 요약</h2>
              <dl className="mt-6 grid grid-cols-1 gap-4 text-sm text-slate-100 sm:grid-cols-2">
                {interestItems.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/20 bg-white/10 p-4">
                    <dt className="text-xs uppercase tracking-wide text-primary-foreground opacity-70">{item.title}</dt>
                    <dd className="mt-2 text-lg font-semibold text-white">{item.highlight}</dd>
                    <p className="mt-2 text-xs text-primary-foreground opacity-70">{item.description}</p>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-sm font-medium text-amber-200">빠르게 준비해야 안전합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interest */}
      <section className="bg-secondary py-20 transition-colors duration-200 dark:bg-secondary" aria-labelledby="interest-section">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Interest</p>
            <h2 id="interest-section" className="text-3xl font-bold sm:text-4xl">
              법 시행 안내 & 소요 기간
            </h2>
            <p className="text-base text-muted-foreground">
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
      <section className="bg-desire py-20 transition-colors duration-200" aria-labelledby="desire-section">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Desire</p>
            <h2 id="desire-section" className="mt-3 text-3xl font-bold sm:text-4xl">
              양성화의 장점과 확실한 절차
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              30년 노하우로 진행되는 맞춤 컨설팅과 함께 합법화의 모든 과정을 한 번에 해결하세요.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {desireItems.map((item) => (
              <InfoCard key={item.title} icon={<span>{item.icon}</span>} title={item.title} description={item.description} />
            ))}
          </div>
          <div className="mt-16 space-y-6">
            <h3 className="text-center text-2xl font-semibold text-foreground">양성화 절차 타임라인</h3>
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
                <CTAButton className="sm:w-auto" onClick={() => setModalOpen(true)}>
                  지금 상담 신청하기
                </CTAButton>
                <CTAButton tone="secondary" className="sm:w-auto" onClick={() => setModalOpen(true)}>
                  문의 남기기
                </CTAButton>
              </div>
            </div>
              <div className="space-y-4 rounded-2xl border border-primary-foreground bg-primary-foreground p-8 text-sm border-opacity-20 bg-opacity-10">
                <div>
                  <p className="font-semibold uppercase tracking-wide text-primary-foreground opacity-70">Contact</p>
                  <p className="mt-1 text-base font-medium text-primary-foreground">
                    ㈜인터월드엔지니어링 건축사사무소
                  </p>
                </div>
                <div className="space-y-2 text-primary-foreground opacity-80">
                  <p>웹사이트: <span className="font-semibold">www.양성화.com</span> / <span className="font-semibold">www.archlegal.co.kr</span></p>
                  <p>전화번호: 02-0000-0000</p>
                </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
