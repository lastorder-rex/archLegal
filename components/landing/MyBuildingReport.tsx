'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  Landmark,
  MapPin,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { AddressSearchModal } from '@/components/consultation/AddressSearchModal';
import type { AddressSearchResult } from '@/lib/validations/consultation';

// ─────────────────────────────────────────────────────────────────────────────
// 「내 집 양성화 리포트」 — 주소 한 줄 → 위반등재 + 건축물대장 + 시한 + 이행강제금/가능성 연결.
// 데이터는 모두 rex 자산: /api/building/violation, /api/building/title, calc/check 엔진.
// 즉답(등재·대장·시한)으로 후킹 → 정밀도구(/calc·/check)·상담으로 전환.
// ─────────────────────────────────────────────────────────────────────────────

const DEADLINE = new Date('2028-06-16T23:59:59+09:00'); // 특별조치법 신청 한시(시행+18개월)

function daysLeft() {
  return Math.max(0, Math.ceil((DEADLINE.getTime() - Date.now()) / 86_400_000));
}

function fmtArea(v: number | string | null | undefined) {
  const n = typeof v === 'string' ? Number(v) : v;
  if (!n || Number.isNaN(n)) return '정보없음';
  return `${Math.round(n).toLocaleString()}㎡`;
}

function fmtApprovalDate(raw: unknown) {
  const s = typeof raw === 'string' ? raw : '';
  if (s && s.length >= 8) return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
  return null;
}

type Report = {
  address: string;
  violation: boolean | null;
  use: string | null;
  totArea: number | string | null;
  ground: number | null;
  under: number | null;
  structure: string | null;
  approval: string | null;
};

type Phase = 'idle' | 'loading' | 'report';

export function MyBuildingReport({
  variant = 'section',
  openSignal = 0,
  onConsult,
}: {
  variant?: 'section' | 'hero';
  openSignal?: number;
  onConsult?: (payload: { address: AddressSearchResult; message: string }) => void;
} = {}) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [report, setReport] = useState<Report | null>(null);
  // 조회에 사용한 원본 주소 객체 — 상담 팝업 프리필/저장에 그대로 넘긴다.
  const [selectedAddress, setSelectedAddress] = useState<AddressSearchResult | null>(null);

  // 히어로 좌측 CTA("주소로 30초 확인")가 우측 카드의 주소 모달을 열도록 신호로 연결.
  useEffect(() => {
    if (openSignal > 0) setOpen(true);
  }, [openSignal]);

  // "이 위반, 무료 상담받기" — /qna 이동이 아니라 무료상담 팝업을 프리필로 연다.
  // 주소·메시지를 sessionStorage에도 백업 → 카카오 로그인 왕복(전체 리다이렉트) 후에도 복원되게 한다.
  function handleConsult() {
    if (!report || !selectedAddress) return;
    const message = buildConsultMessage(report);
    try {
      window.sessionStorage.setItem(
        'calc_consultation_prefill',
        JSON.stringify({ address: selectedAddress, addressDetail: '', message })
      );
    } catch {}
    if (onConsult) {
      onConsult({ address: selectedAddress, message });
    } else if (typeof window !== 'undefined') {
      // 부모가 팝업을 소유하지 않는 경우(섹션 변형 등)의 폴백 — 랜딩으로 이동해 열기.
      window.location.href = '/?consultation=open';
    }
  }

  async function handleSelect(address: AddressSearchResult) {
    setOpen(false);
    setPhase('loading');
    setReport(null);
    setSelectedAddress(address);
    const label = address.roadAddr || address.jibunAddr || '선택한 주소';
    const ac = address.addressCode;
    const code4 = { ...ac, bun: ac.bun.padStart(4, '0'), ji: ac.ji.padStart(4, '0') };

    const [violationRes, titleRes] = await Promise.allSettled([
      fetch('/api/building/violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressCode: code4 }),
      }).then(r => r.json()),
      fetch('/api/building/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ac),
      }).then(r => r.json()),
    ]);

    const violation =
      violationRes.status === 'fulfilled' && violationRes.value?.ok
        ? (violationRes.value.violation ?? null)
        : null;

    const b = titleRes.status === 'fulfilled' ? titleRes.value?.building : null;

    setReport({
      address: label,
      violation,
      use: b?.mainPurpsCdNm ?? null,
      totArea: b?.totArea ?? null,
      ground: b?.groundFloorCnt ?? b?.grndFlrCnt ?? null,
      under: b?.ugrndFloorCnt ?? null,
      structure: b?.structure ?? null,
      approval: fmtApprovalDate(b?.rawData?.useAprDay),
    });
    setPhase('report');
  }

  const isHero = variant === 'hero';

  return (
    <div className="w-full">
      {phase === 'idle' &&
        (isHero ? <IdleCompact onStart={() => setOpen(true)} /> : <IdleHero onStart={() => setOpen(true)} />)}
      {phase === 'loading' && (isHero ? <LoadingCompact /> : <LoadingState />)}
      {phase === 'report' &&
        report &&
        (isHero ? (
          <ReportCompact report={report} onReset={() => setPhase('idle')} onRetry={() => setOpen(true)} onConsult={handleConsult} />
        ) : (
          <ReportView report={report} onReset={() => setPhase('idle')} onRetry={() => setOpen(true)} onConsult={handleConsult} />
        ))}

      <AddressSearchModal isOpen={open} onClose={() => setOpen(false)} onSelect={handleSelect} />
    </div>
  );
}

// ── 입력 전(후크) ────────────────────────────────────────────────────────────
function IdleHero({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
      <div className="flex-1 space-y-5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          30초 무료 진단 · 로그인 불필요
        </span>
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-[2.6rem]">
          내 집, <span className="text-primary">위반건축물</span>일까요?
        </h2>
        <p className="max-w-xl text-base leading-7 text-muted-foreground">
          주소만 넣으면 <b className="text-foreground">건축물대장 위반 등재 여부</b>와 건물 정보, 특별조치법
          남은 시한, 이행강제금·양성화 가능성을 <b className="text-foreground">한 화면</b>에서 확인합니다.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 sm:w-auto"
        >
          <Search className="h-5 w-5" aria-hidden />
          내 집 주소로 진단 시작
        </button>
      </div>

      <Link
        href="/qna3d"
        aria-label="3D 위반건축물 진단으로 이동"
        className="group relative hidden overflow-hidden rounded-2xl border border-border bg-card shadow-lg lg:block lg:flex-1"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/home/building-preview.png"
          alt="3D 건물에서 위반 부위를 짚어보는 미리보기"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-md">
          3D로 직접 짚어보기 →
        </span>
      </Link>
    </div>
  );
}

// ── 로딩 ─────────────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="mx-auto w-full max-w-5xl rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        건축물대장·위반등재 조회 중…
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/60" />
        ))}
      </div>
    </div>
  );
}

// ── 리포트 ───────────────────────────────────────────────────────────────────
function ReportView({
  report,
  onReset,
  onRetry,
  onConsult,
}: {
  report: Report;
  onReset: () => void;
  onRetry: () => void;
  onConsult: () => void;
}) {
  const d = daysLeft();
  const v = report.violation;
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  const prescription =
    v === true
      ? '한시법 시한 안에 양성화(추인·신고·허가)를 검토하세요. 방치하면 이행강제금이 매년 가중됩니다.'
      : v === false
        ? '현재 위반 신호는 낮지만, 도면 대조·자가진단으로 한 번 더 확인을 권합니다.'
        : '주소를 정확히 입력하거나, 1분 자가진단으로 가능성을 확인해 보세요.';

  const verdict = buildVerdict(v);

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      {/* 브랜드 스트립 — "건물 건강검진서" 아이덴티티 */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Stethoscope className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sm font-extrabold tracking-tight text-foreground">
            양성화<span className="text-primary">.com</span> 건물 건강검진서
          </span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">진단일 {dateStr}</span>
      </div>

      {/* 판정 배너 — 파스텔 채움 대신 좌측 강조바 + 상태칩(깔끔·의도적) */}
      <div className={`flex items-start gap-4 border-b border-l-4 border-border bg-card px-6 py-6 ${verdict.bar}`}>
        {verdict.icon}
        <div className="min-w-0">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide ${verdict.chip}`}
          >
            {verdict.tag}
          </span>
          <h3 className="mt-1.5 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{verdict.title}</h3>
          <p className="mt-1.5 flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{report.address}</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{verdict.desc}</p>
        </div>
      </div>

      {/* 시한 카운트다운 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-foreground px-6 py-4 text-background">
        <div className="flex items-center gap-2.5">
          <Clock className="h-5 w-5 shrink-0" aria-hidden />
          <span className="text-sm font-semibold">특별조치법 한시 — 지금 시작해야 안전합니다</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm opacity-80">신청 마감까지</span>
          <span className="text-2xl font-black tabular-nums text-amber-400">D-{d.toLocaleString()}</span>
          <span className="text-xs opacity-70">(~2028.06.16)</span>
        </div>
      </div>

      {/* 3카드 */}
      <div className="grid gap-px bg-border sm:grid-cols-3">
        {/* 건축물대장 */}
        <div className="bg-card p-5">
          <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Building2 className="h-4 w-4 text-primary" aria-hidden />
            건축물대장
          </p>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row k="주용도" val={report.use ?? '정보없음'} />
            <Row k="연면적" val={fmtArea(report.totArea)} />
            <Row
              k="층수"
              val={
                report.ground != null
                  ? `지상 ${report.ground}층${report.under ? ` · 지하 ${report.under}층` : ''}`
                  : '정보없음'
              }
            />
            <Row k="구조" val={report.structure ?? '정보없음'} />
            {report.approval && <Row k="사용승인" val={report.approval} />}
          </dl>
        </div>

        {/* 이행강제금 */}
        <Link href="/calc" className="group block bg-card p-5 transition hover:bg-muted/40">
          <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Receipt className="h-4 w-4 text-primary" aria-hidden />
            이행강제금
          </p>
          <p className="mt-3 text-sm leading-6 text-card-foreground">
            위반은 시정 시까지 <b className="text-red-600">매년 반복·가중</b> 부과됩니다. 전국 평균
            <b> 건당 약 141만 원</b>.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
            내 건물 정확히 계산 <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>

        {/* 양성화 가능성 */}
        <Link href="/check" className="group block bg-card p-5 transition hover:bg-muted/40">
          <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Landmark className="h-4 w-4 text-primary" aria-hidden />
            양성화 가능성
          </p>
          <p className="mt-3 text-sm leading-6 text-card-foreground">
            {v === true
              ? '특별조치법 검토 대상일 수 있습니다. 완공시점·면적·구역 기준으로 가능성을 좁혀보세요.'
              : '대장 기준 1차 점검 후, 완공시점·구역 등으로 가능성을 확인하세요.'}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
            1분 정밀 자가진단 <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3 border-t border-border bg-muted/30 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onConsult}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-extrabold text-primary-foreground transition hover:opacity-90"
          >
            이 위반, 무료 상담받기
          </button>
          <Link
            href="/qna3d"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-card px-5 text-base font-bold text-foreground transition hover:border-primary hover:text-primary"
          >
            3D로 위반 부위 보기
          </Link>
        </div>
        <div className="flex gap-4 text-sm">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 font-semibold text-muted-foreground transition hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            다른 주소
          </button>
          <button
            type="button"
            onClick={onReset}
            className="font-semibold text-muted-foreground transition hover:text-foreground"
          >
            처음으로
          </button>
        </div>
      </div>

      {/* 처방 + 면책 (검진서 하단) */}
      <div className="border-t border-border px-6 py-4">
        <p className="text-xs leading-5 text-muted-foreground">
          <b className="text-foreground">처방</b> · {prescription}
        </p>
        <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground/80">
          본 진단은 공공데이터 기반 1차 정보입니다. 최종 양성화 가능 여부는
          건축사 현장검토와 관할 지자체 기준에 따라 달라질 수 있습니다.
        </p>
      </div>
    </div>
  );
}

function Row({ k, val }: { k: string; val: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{k}</dt>
      <dd className="text-right font-semibold text-card-foreground">{val}</dd>
    </div>
  );
}

// 판정 메타 — 섹션/컴팩트 리포트가 공유.
function buildVerdict(v: boolean | null) {
  if (v === true)
    return {
      bar: 'border-l-rose-500',
      chip: 'bg-rose-600 text-white',
      icon: <AlertTriangle className="h-7 w-7 shrink-0 text-rose-600" aria-hidden />,
      tag: '위반건축물 등재',
      title: '위반건축물로 등재돼 있습니다',
      desc: '건축물대장에 위반 표시가 있는 상태입니다. 한시법 기간 안에 양성화를 검토하는 것이 유리합니다.',
    };
  if (v === false)
    return {
      bar: 'border-l-emerald-500',
      chip: 'bg-emerald-600 text-white',
      icon: <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-600" aria-hidden />,
      tag: '등재 미확인',
      title: '위반 등재가 확인되지 않습니다',
      desc: "다만 '합법' 확정은 아닙니다 — 일부 지역은 위반정보가 제공되지 않아, 도면 대조·자가진단으로 한 번 더 확인하길 권합니다.",
    };
  return {
    bar: 'border-l-slate-300',
    chip: 'bg-slate-500 text-white',
    icon: <HelpCircle className="h-7 w-7 shrink-0 text-muted-foreground" aria-hidden />,
    tag: '조회 불가',
    title: '이 주소는 조회되지 않았습니다',
    desc: '주소를 특정하지 못했거나 해당 지역 위반정보가 제공되지 않을 수 있습니다.',
  };
}

// 상담 팝업에 자동으로 채울 짧은 메시지 — 리포트의 주소·판정을 요약.
function buildConsultMessage(report: Report): string {
  return [
    '내 집 양성화 리포트에서 상담 요청드립니다.',
    `- 주소: ${report.address}`,
    `- 진단: ${buildVerdict(report.violation).tag}`,
    '위 건물 양성화 절차 상담 부탁드립니다.',
  ].join('\n');
}

// ── 히어로 컴팩트 변형 (home-v2 히어로 우측 컬럼용) ──────────────────────────────
// 풀폭 섹션 대신 컬럼 한 칸에 들어가는 입력 카드 + 응축 리포트.
function IdleCompact({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-card p-7 shadow-2xl">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        30초 무료 진단 · 로그인 불필요
      </span>
      <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-foreground">
        내 집, <span className="text-primary">위반건축물</span>일까요?
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        주소만 넣으면 <b className="text-foreground">위반 등재 여부</b>·건물정보·남은 시한을 바로 이 자리에서 확인합니다.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
      >
        <Search className="h-5 w-5" aria-hidden />
        주소로 30초 확인
      </button>
      <p className="mt-3 text-center text-[11px] text-muted-foreground/80">공공데이터 기반 1차 진단</p>
    </div>
  );
}

function LoadingCompact() {
  return (
    <div className="rounded-3xl border border-white/60 bg-card p-7 shadow-2xl">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        건축물대장·위반등재 조회 중…
      </div>
      <div className="mt-6 space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/60" />
        ))}
      </div>
    </div>
  );
}

function ReportCompact({
  report,
  onReset,
  onRetry,
  onConsult,
}: {
  report: Report;
  onReset: () => void;
  onRetry: () => void;
  onConsult: () => void;
}) {
  const d = daysLeft();
  const v = report.violation;
  const verdict = buildVerdict(v);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-card shadow-2xl">
      {/* 판정 */}
      <div className={`flex items-start gap-3 border-b border-l-4 border-border px-5 py-5 ${verdict.bar}`}>
        {verdict.icon}
        <div className="min-w-0">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide ${verdict.chip}`}>
            {verdict.tag}
          </span>
          <h3 className="mt-1.5 text-lg font-extrabold tracking-tight text-foreground">{verdict.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{report.address}</span>
          </p>
        </div>
      </div>

      {/* 시한 */}
      <div className="flex items-center justify-between gap-2 bg-foreground px-5 py-3 text-background">
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <Clock className="h-4 w-4 shrink-0" aria-hidden />
          특별조치법 신청 마감까지
        </span>
        <span className="text-xl font-black tabular-nums text-amber-400">D-{d.toLocaleString()}</span>
      </div>

      {/* 핵심 + 정밀도구 링크 */}
      <div className="grid grid-cols-2 gap-px bg-border">
        <Link href="/calc" className="group bg-card p-4 transition hover:bg-muted/40">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <Receipt className="h-3.5 w-3.5 text-primary" aria-hidden />
            이행강제금
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary">
            정확히 계산 <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>
        <Link href="/check" className="group bg-card p-4 transition hover:bg-muted/40">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <Landmark className="h-3.5 w-3.5 text-primary" aria-hidden />
            양성화 가능성
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary">
            1분 자가진단 <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>
      </div>

      {/* CTA */}
      <div className="border-t border-border bg-muted/30 px-5 py-4">
        <button
          type="button"
          onClick={onConsult}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-extrabold text-primary-foreground transition hover:opacity-90"
        >
          이 위반, 무료 상담받기
        </button>
        <div className="mt-3 flex justify-center gap-4 text-xs">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 font-semibold text-muted-foreground transition hover:text-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            다른 주소
          </button>
          <button type="button" onClick={onReset} className="font-semibold text-muted-foreground transition hover:text-foreground">
            처음으로
          </button>
        </div>
      </div>
    </div>
  );
}
