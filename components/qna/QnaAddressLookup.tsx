'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AddressSearchModal } from '@/components/consultation/AddressSearchModal';
import type { AddressSearchResult } from '@/lib/validations/consultation';

// qna 히어로의 "우리 집도 위반건축물?" 주소조회 아일랜드.
//  - 버튼은 정적 본문(dangerouslySetInnerHTML) 안의 #qna-lookup-mount 로 portal
//  - 주소 선택은 기존 AddressSearchModal 재사용 → /api/building/violation(POST)로 등재여부 조회
//  - 결과 3-state: 등재됨 / 등재 미확인(합법 단정 금지) / 조회 불가

type Lookup = { violation: boolean | null; address: string };

export function QnaAddressLookup() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [mountMobile, setMountMobile] = useState<HTMLElement | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Lookup | null>(null);

  useEffect(() => {
    setMount(document.getElementById('qna-lookup-mount'));
    setMountMobile(document.getElementById('qna-lookup-mount-mobile'));
  }, []);

  async function handleSelect(address: AddressSearchResult) {
    setSearchOpen(false);
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
      {mount &&
        createPortal(
          <button
            type="button"
            className="btn btn--pine btn--lg"
            onClick={() => setSearchOpen(true)}
          >
            우리 집도 위반건축물? →
          </button>,
          mount
        )}

      {mountMobile &&
        createPortal(
          <button
            type="button"
            className="btn btn--ghost"
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setSearchOpen(true)}
          >
            우리 집도 위반건축물?
          </button>,
          mountMobile
        )}

      <AddressSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSelect}
      />

      {(loading || result) && (
        <ResultOverlay loading={loading} result={result} onClose={() => setResult(null)} />
      )}
    </>
  );
}

function ResultOverlay({
  loading,
  result,
  onClose,
}: {
  loading: boolean;
  result: Lookup | null;
  onClose: () => void;
}) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(20,24,22,.45)',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          background: 'var(--paper-3, #fbf9f3)',
          borderRadius: 18,
          padding: '26px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,.32)',
          fontFamily: 'var(--sans)',
          color: 'var(--ink, #22282a)',
        }}
      >
        {/* 우측 상단 닫기 (lucide X — https://lucide.dev/icons/x) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-3, #7c8480)',
            padding: 0,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-2, #4a524f)' }}>
            건축물대장 위반등재 조회 중…
          </div>
        ) : result ? (
          <ResultBody result={result} onClose={onClose} />
        ) : null}
      </div>
    </div>,
    document.body
  );
}

function ResultBody({ result, onClose }: { result: Lookup; onClose: () => void }) {
  const { violation, address } = result;
  const head =
    violation === true
      ? { tag: '위반건축물 등재', color: '#d8412f', title: '위반건축물로 등재돼 있습니다' }
      : violation === false
        ? { tag: '등재 미확인', color: '#7c8480', title: '위반 등재가 확인되지 않습니다' }
        : { tag: '조회 불가', color: '#7c8480', title: '이 주소는 조회되지 않았습니다' };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, color: head.color, letterSpacing: '.04em' }}>
        {head.tag}
      </div>
      <h3 style={{ margin: '6px 0 4px', fontSize: '1.25rem', fontWeight: 850, letterSpacing: '-.02em' }}>
        {head.title}
      </h3>
      <div style={{ fontSize: 13, color: 'var(--ink-3, #7c8480)', marginBottom: 14 }}>📍 {address}</div>

      {violation === true && (
        <p style={{ fontSize: 14, color: 'var(--ink-2, #4a524f)', lineHeight: 1.6, margin: '0 0 18px' }}>
          건축물대장에 <b>위반건축물로 등재</b>된 상태입니다. 양성화(추인·신고·허가) 가능성을 이어서 확인해 보세요.
        </p>
      )}
      {violation === false && (
        <p style={{ fontSize: 14, color: 'var(--ink-2, #4a524f)', lineHeight: 1.6, margin: '0 0 18px' }}>
          이 주소에서는 위반 등재가 확인되지 않았습니다. 다만 <b>‘합법’을 보장하는 것은 아닙니다</b> — 일부 지역은 위반정보가
          제공되지 않아, 도면 대조나 자가진단으로 한 번 더 확인하시길 권합니다.
        </p>
      )}
      {violation === null && (
        <p style={{ fontSize: 14, color: 'var(--ink-2, #4a524f)', lineHeight: 1.6, margin: '0 0 18px' }}>
          주소를 특정하지 못했거나, 해당 지역의 위반정보가 제공되지 않을 수 있습니다. 자가진단으로 가능성을 확인해 보세요.
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {violation === true ? (
          <>
            <a className="btn btn--pine" href="/check">
              양성화 가능성 진단하기
            </a>
            <a className="btn btn--ghost" href="#consult" onClick={onClose}>
              무료 상담
            </a>
          </>
        ) : (
          <>
            <a className="btn btn--pine" href="/check">
              1분 자가진단
            </a>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              닫기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
