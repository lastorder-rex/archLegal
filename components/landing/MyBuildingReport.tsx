'use client';

import { useState } from 'react';
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

export function MyBuildingReport() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [report, setReport] = useState<Report | null>(null);

  async function handleSelect(address: AddressSearchResult) {
    setOpen(false);
    setPhase('loading');
    setReport(null);
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

  return (
    <div className="mx-auto w-full max-w-5xl">
      {phase === 'idle' && <IdleHero onStart={() => setOpen(true)} />}
      {phase === 'loading' && <LoadingState />}
      {phase === 'report' && report && (
        <ReportView report={report} onReset={() => setPhase('idle')} onRetry={() => setOpen(true)} />
      )}

      <AddressSearchModal isOpen={open} onClose={() => setOpen(false)} onSelect={handleSelect} />
    </div>
  );
}

// ── 입력 전(후크) ────────────────────────────────────────────────────────────
function IdleHero({ onStart }: { onStart: () => void }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
      <div className="space-y-5">
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
        <p className="text-xs text-muted-foreground">전국 7만+ 위반건축물 데이터 · 건축물대장 실시간 조회 기반</p>
      </div>

      <Link
        href="/qna"
        aria-label="3D 위반건축물 진단으로 이동"
        className="group relative hidden overflow-hidden rounded-2xl border border-border bg-card shadow-lg lg:block"
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
    <div className="overflow-hidden rounded-2xl border border-[#34343a] bg-[#202020] shadow-2xl">
      <div className="h-1 w-full bg-gradient-to-r from-[#ff4628] via-[#ff6a4d] to-[#b8c8d7]" />
      <div className="p-8">
        <div className="flex items-center gap-3 text-[#b8c8d7]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#ff4628] border-t-transparent" />
          건축물대장·위반등재 조회 중…
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-[#181818]" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 리포트 ───────────────────────────────────────────────────────────────────
function ReportView({
  report,
  onReset,
  onRetry,
}: {
  report: Report;
  onReset: () => void;
  onRetry: () => void;
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

  const verdict =
    v === true
      ? {
          wrap: 'border-l-4 border-[#ff4628] bg-[#ff4628]/10',
          accent: 'text-[#ff6a4d]',
          icon: <AlertTriangle className="h-7 w-7 shrink-0 text-[#ff4628]" aria-hidden />,
          tag: '위반건축물 등재',
          title: '위반건축물로 등재돼 있습니다',
          desc: '건축물대장에 위반 표시가 있는 상태입니다. 한시법 기간 안에 양성화를 검토하는 것이 유리합니다.',
        }
      : v === false
        ? {
            wrap: 'border-l-4 border-[#b8c8d7] bg-[#b8c8d7]/10',
            accent: 'text-[#b8c8d7]',
            icon: <CheckCircle2 className="h-7 w-7 shrink-0 text-[#b8c8d7]" aria-hidden />,
            tag: '등재 미확인',
            title: '위반 등재가 확인되지 않습니다',
            desc: "다만 '합법' 확정은 아닙니다 — 일부 지역은 위반정보가 제공되지 않아, 도면 대조·자가진단으로 한 번 더 확인하길 권합니다.",
          }
        : {
            wrap: 'border-l-4 border-[#3a3f46] bg-white/5',
            accent: 'text-[#8a97a3]',
            icon: <HelpCircle className="h-7 w-7 shrink-0 text-[#8a97a3]" aria-hidden />,
            tag: '조회 불가',
            title: '이 주소는 조회되지 않았습니다',
            desc: '주소를 특정하지 못했거나 해당 지역 위반정보가 제공되지 않을 수 있습니다.',
          };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#34343a] bg-[#202020] shadow-2xl ring-1 ring-black/40">
      {/* 문서 상단 액센트 바 */}
      <div className="h-1 w-full bg-gradient-to-r from-[#ff4628] via-[#ff6a4d] to-[#b8c8d7]" />

      {/* 브랜드 스트립 — "건물 건강검진서" 아이덴티티 */}
      <div className="flex items-center justify-between gap-3 border-b border-[#34343a] px-6 py-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#ff4628] text-white">
            <Stethoscope className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sm font-extrabold tracking-tight text-[#eef1f4]">
            양성화<span className="text-[#ff4628]">.com</span> 건물 건강검진서
          </span>
        </div>
        <span className="text-xs font-medium text-[#8a97a3]">진단일 {dateStr}</span>
      </div>

      {/* 판정 배너 */}
      <div className={`flex items-start gap-4 border-b border-[#34343a] px-6 py-6 ${verdict.wrap}`}>
        {verdict.icon}
        <div className="min-w-0">
          <p className={`text-xs font-extrabold tracking-wide ${verdict.accent}`}>{verdict.tag}</p>
          <h3 className="mt-0.5 text-xl font-extrabold tracking-tight text-[#eef1f4] sm:text-2xl">{verdict.title}</h3>
          <p className="mt-1.5 flex items-center gap-1 text-sm font-medium text-[#b8c8d7]">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{report.address}</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-[#b8c8d7]">{verdict.desc}</p>
        </div>
      </div>

      {/* 시한 카운트다운 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#34343a] bg-[#181818] px-6 py-4">
        <div className="flex items-center gap-2.5 text-[#eef1f4]">
          <Clock className="h-5 w-5 shrink-0 text-[#ff4628]" aria-hidden />
          <span className="text-sm font-semibold">특별조치법 한시 — 지금 시작해야 안전합니다</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-[#8a97a3]">신청 마감까지</span>
          <span className="text-2xl font-black tabular-nums text-[#ff4628]">D-{d.toLocaleString()}</span>
          <span className="text-xs text-[#8a97a3]">(~2028.06.16)</span>
        </div>
      </div>

      {/* 3카드 */}
      <div className="grid gap-px bg-[#34343a] sm:grid-cols-3">
        {/* 건축물대장 */}
        <div className="bg-[#181818] p-5">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#8a97a3]">
            <Building2 className="h-4 w-4 text-[#ff4628]" aria-hidden />
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
        <Link href="/calc" className="group block bg-[#181818] p-5 transition hover:bg-[#181818]">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#8a97a3]">
            <Receipt className="h-4 w-4 text-[#ff4628]" aria-hidden />
            이행강제금
          </p>
          <p className="mt-3 text-sm leading-6 text-[#b8c8d7]">
            위반은 시정 시까지 <b className="text-[#ff6a4d]">매년 반복·가중</b> 부과됩니다. 전국 평균
            <b className="text-[#eef1f4]"> 건당 약 141만 원</b>.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#ff4628]">
            내 건물 정확히 계산 <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>

        {/* 양성화 가능성 */}
        <Link href="/check" className="group block bg-[#181818] p-5 transition hover:bg-[#181818]">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#8a97a3]">
            <Landmark className="h-4 w-4 text-[#ff4628]" aria-hidden />
            양성화 가능성
          </p>
          <p className="mt-3 text-sm leading-6 text-[#b8c8d7]">
            {v === true
              ? '특별조치법 검토 대상일 수 있습니다. 완공시점·면적·구역 기준으로 가능성을 좁혀보세요.'
              : '대장 기준 1차 점검 후, 완공시점·구역 등으로 가능성을 확인하세요.'}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#ff4628]">
            1분 정밀 자가진단 <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3 border-t border-[#34343a] bg-[#181818] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/qna"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#ff4628] px-6 text-base font-extrabold text-white shadow-lg shadow-[#ff4628]/25 transition hover:bg-[#ff6a4d]"
          >
            이 위반, 무료 상담받기
          </Link>
          <Link
            href="/qna"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#3a3f46] px-5 text-base font-bold text-[#eef1f4] transition hover:border-[#ff4628] hover:text-[#ff4628]"
          >
            3D로 위반 부위 보기
          </Link>
        </div>
        <div className="flex gap-4 text-sm">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 font-semibold text-[#8a97a3] transition hover:text-[#eef1f4]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            다른 주소
          </button>
          <button
            type="button"
            onClick={onReset}
            className="font-semibold text-[#8a97a3] transition hover:text-[#eef1f4]"
          >
            처음으로
          </button>
        </div>
      </div>

      {/* 처방 + 면책 (검진서 하단) */}
      <div className="border-t border-[#34343a] px-6 py-4">
        <p className="text-xs leading-5 text-[#b8c8d7]">
          <b className="text-[#ff6a4d]">처방</b> · {prescription}
        </p>
        <p className="mt-1.5 text-[11px] leading-4 text-[#6b7681]">
          본 진단은 공공데이터(건축물대장 · 국토교통부 VWorld) 기반 1차 정보입니다. 최종 양성화 가능 여부는
          건축사 현장검토와 관할 지자체 기준에 따라 달라질 수 있습니다.
        </p>
      </div>
    </div>
  );
}

function Row({ k, val }: { k: string; val: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[#8a97a3]">{k}</dt>
      <dd className="text-right font-semibold text-[#eef1f4]">{val}</dd>
    </div>
  );
}
