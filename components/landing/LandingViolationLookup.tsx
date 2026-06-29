'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { AddressSearchModal } from '@/components/consultation/AddressSearchModal';
import type { AddressSearchResult } from '@/lib/validations/consultation';

// 랜딩(home-v2)용 주소 위반조회 — 앱 테마(Tailwind). qna의 QnaAddressLookup과 같은 데이터 흐름
// (AddressSearchModal → /api/building/violation)이지만 랜딩 스타일로 가볍게. 즉답(등재 여부) 후
// /check·/qna로 연결(전체 로그인-게이트 상담은 /qna에 있음).
type Lookup = { violation: boolean | null; address: string };

export function LandingViolationLookup() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Lookup | null>(null);

  async function handleSelect(address: AddressSearchResult) {
    setOpen(false);
    setLoading(true);
    setResult(null);
    const label = address.roadAddr || address.jibunAddr || '선택한 주소';
    const ac = address.addressCode;
    try {
      const res = await fetch('/api/building/violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressCode: {
            sigunguCd: ac.sigunguCd,
            bjdongCd: ac.bjdongCd,
            platGbCd: ac.platGbCd,
            bun: ac.bun.padStart(4, '0'),
            ji: ac.ji.padStart(4, '0'),
          },
        }),
      });
      const data = await res.json();
      setResult({ violation: res.ok ? data.violation ?? null : null, address: label });
    } catch {
      setResult({ violation: null, address: label });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-bold text-primary-foreground transition hover:opacity-90"
      >
        우리 집도 위반건축물? →
      </button>

      <AddressSearchModal isOpen={open} onClose={() => setOpen(false)} onSelect={handleSelect} />

      {(loading || result) && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/45 p-4"
          onClick={() => setResult(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-card p-7 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setResult(null)}
              className="absolute right-3 top-3 text-muted-foreground transition hover:text-foreground"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>

            {loading ? (
              <div className="py-8 text-center text-muted-foreground">건축물대장 위반등재 조회 중…</div>
            ) : result ? (
              <LookupResult result={result} />
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

function LookupResult({ result }: { result: Lookup }) {
  const { violation, address } = result;
  const head =
    violation === true
      ? { tag: '위반건축물 등재', tagClass: 'text-red-600', title: '위반건축물로 등재돼 있습니다' }
      : violation === false
        ? { tag: '등재 미확인', tagClass: 'text-muted-foreground', title: '위반 등재가 확인되지 않습니다' }
        : { tag: '조회 불가', tagClass: 'text-muted-foreground', title: '이 주소는 조회되지 않았습니다' };

  return (
    <div>
      <p className={`text-xs font-extrabold tracking-wide ${head.tagClass}`}>{head.tag}</p>
      <h3 className="mt-1.5 text-xl font-extrabold tracking-tight text-card-foreground">{head.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">📍 {address}</p>

      {violation === true && (
        <p className="mt-3.5 text-sm leading-6 text-muted-foreground">
          건축물대장에 <b className="text-card-foreground">위반건축물로 등재</b>된 상태입니다. 양성화(추인·신고·허가) 가능성을 이어서 확인해 보세요.
        </p>
      )}
      {violation === false && (
        <p className="mt-3.5 text-sm leading-6 text-muted-foreground">
          이 주소에서는 위반 등재가 확인되지 않았습니다. 다만 <b className="text-card-foreground">‘합법’을 보장하는 것은 아닙니다</b> — 일부 지역은 위반정보가 제공되지 않아, 도면 대조나 자가진단으로 한 번 더 확인하시길 권합니다.
        </p>
      )}
      {violation === null && (
        <p className="mt-3.5 text-sm leading-6 text-muted-foreground">
          주소를 특정하지 못했거나, 해당 지역의 위반정보가 제공되지 않을 수 있습니다. 자가진단으로 가능성을 확인해 보세요.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2.5">
        <Link
          href="/check"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:opacity-90"
        >
          {violation === true ? '양성화 가능성 진단' : '1분 자가진단'}
        </Link>
        <Link
          href="/qna3d"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary"
        >
          3D 위반사례 보기
        </Link>
      </div>
    </div>
  );
}
