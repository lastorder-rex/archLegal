'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { AddressSearchModal } from '@/components/consultation/AddressSearchModal';
import type { AddressSearchResult } from '@/lib/validations/consultation';
import { getKakaoOAuthOptions } from '@/lib/auth/oauth';

// qna 히어로/모바일바의 "우리 집도 위반건축물?" 주소조회 + (가)안 무료상담 아일랜드.
//  - 주소 선택(AddressSearchModal 재사용) → /api/building/violation 로 등재여부 조회(3-state)
//  - 무료상담은 "로그인 먼저" — 폼 입력 전에 카카오 로그인(어중이떠중이 필터). 로그인이 곧 신원.
//    비로그인이면 조회한 주소를 sessionStorage에 보류 → 카카오 리다이렉트 → 복귀 후 상담 확인폼 재개.
//    제출은 기존 /api/consultations 재사용(주소는 방금 조회한 그 주소).

type AddressCode = AddressSearchResult['addressCode'];
type Lookup = { violation: boolean | null; address: string; code: AddressCode };
type ConsultView = 'none' | 'confirm' | 'done';

const PENDING_KEY = 'qnaConsultPending';

export function QnaAddressLookup() {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [mountMobile, setMountMobile] = useState<HTMLElement | null>(null);
  const [mountConsult, setMountConsult] = useState<HTMLElement | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Lookup | null>(null);
  const [consult, setConsult] = useState<ConsultView>('none');

  useEffect(() => {
    setMount(document.getElementById('qna-lookup-mount'));
    setMountMobile(document.getElementById('qna-lookup-mount-mobile'));
    setMountConsult(document.getElementById('qna-lookup-mount-consult'));
  }, []);

  // 카카오 로그인 리다이렉트 복귀 → 보류된 상담 재개
  useEffect(() => {
    if (!user) return;
    let pending: Lookup | null = null;
    try {
      pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
    } catch {
      pending = null;
    }
    if (pending && pending.code) {
      setResult(pending);
      setConsult('confirm');
      sessionStorage.removeItem(PENDING_KEY);
      if (typeof window !== 'undefined' && window.location.search.includes('qnaConsult')) {
        window.history.replaceState(null, '', '/qna');
      }
    }
  }, [user]);

  async function handleSelect(address: AddressSearchResult) {
    setSearchOpen(false);
    setConsult('none');
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
      setResult({ violation: res.ok ? data.violation ?? null : null, address: label, code: ac });
    } catch {
      setResult({ violation: null, address: label, code: ac });
    } finally {
      setLoading(false);
    }
  }

  // 무료상담 시작 — 로그인 먼저
  function startConsult() {
    if (!result) return;
    if (user) {
      setConsult('confirm');
      return;
    }
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(result));
    } catch {
      /* noop */
    }
    supabase.auth.signInWithOAuth({ provider: 'kakao', options: getKakaoOAuthOptions('/qna?qnaConsult=1') });
  }

  function closeAll() {
    setResult(null);
    setConsult('none');
  }

  return (
    <>
      {mount &&
        createPortal(
          <button type="button" className="btn btn--pine btn--lg" onClick={() => setSearchOpen(true)}>
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

      {mountConsult &&
        createPortal(
          <button
            type="button"
            className="btn btn--pine btn--lg btn--block"
            onClick={() => setSearchOpen(true)}
          >
            주소로 무료상담 신청 →
          </button>,
          mountConsult
        )}

      <AddressSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSelect} />

      {(loading || result) && (
        <ResultOverlay
          loading={loading}
          result={result}
          consult={consult}
          onClose={closeAll}
          onStartConsult={startConsult}
          onDone={() => setConsult('done')}
        />
      )}
    </>
  );
}

function ResultOverlay({
  loading,
  result,
  consult,
  onClose,
  onStartConsult,
  onDone,
}: {
  loading: boolean;
  result: Lookup | null;
  consult: ConsultView;
  onClose: () => void;
  onStartConsult: () => void;
  onDone: () => void;
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
        ) : consult === 'done' ? (
          <ConsultDone />
        ) : consult === 'confirm' && result ? (
          <ConsultForm result={result} onDone={onDone} />
        ) : result ? (
          <ResultBody result={result} onStartConsult={onStartConsult} />
        ) : null}
      </div>
    </div>,
    document.body
  );
}

function ResultBody({ result, onStartConsult }: { result: Lookup; onStartConsult: () => void }) {
  const { violation, address } = result;
  const head =
    violation === true
      ? { tag: '위반건축물 등재', color: '#d8412f', title: '위반건축물로 등재돼 있습니다' }
      : violation === false
        ? { tag: '등재 미확인', color: '#7c8480', title: '위반 등재가 확인되지 않습니다' }
        : { tag: '조회 불가', color: '#7c8480', title: '이 주소는 조회되지 않았습니다' };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, color: head.color, letterSpacing: '.04em' }}>{head.tag}</div>
      <h3 style={{ margin: '6px 0 4px', fontSize: '1.25rem', fontWeight: 850, letterSpacing: '-.02em' }}>
        {head.title}
      </h3>
      <div style={{ fontSize: 13, color: 'var(--ink-3, #7c8480)', marginBottom: 14 }}>📍 {address}</div>

      {violation === true && (
        <p style={{ fontSize: 14, color: 'var(--ink-2, #4a524f)', lineHeight: 1.6, margin: '0 0 18px' }}>
          건축물대장에 <b>위반건축물로 등재</b>된 상태입니다. 이 주소로 무료상담을 받거나 양성화 가능성을 확인해 보세요.
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
            <button type="button" className="btn btn--pine" onClick={onStartConsult}>
              이 주소로 무료상담
            </button>
            <a className="btn btn--ghost" href="/check">
              양성화 가능성 진단하기
            </a>
          </>
        ) : (
          <>
            <a className="btn btn--pine" href="/check">
              1분 자가진단
            </a>
            <button type="button" className="btn btn--ghost" onClick={onStartConsult}>
              이 주소로 무료상담
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 16,
  border: '1.5px solid var(--line, #e3e1da)',
  borderRadius: 11,
  background: '#fff',
  color: 'var(--ink, #22282a)',
  outline: 'none',
  boxSizing: 'border-box',
};

const lockedInputStyle: React.CSSProperties = {
  background: '#f1f3f5',
  color: 'var(--ink-2, #4a524f)',
  cursor: 'not-allowed',
};

function ConsultForm({ result, onDone }: { result: Lookup; onDone: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [locked, setLocked] = useState({ name: false, phone: false });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 로그인 사용자의 프로필(이름·연락처)을 가져와 자동세팅 + 비활성화 (랜딩 상담폼과 동일)
  useEffect(() => {
    let alive = true;
    fetch('/api/users/profile', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        const p = d?.profile;
        const nm = p?.legal_name || p?.full_name || '';
        const ph = p?.contact_phone || p?.phone || '';
        setName(nm);
        setPhone(ph);
        setLocked({ name: !!nm, phone: !!ph });
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingProfile(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || phone.trim().length < 9) {
      setError('이름과 연락처를 정확히 입력해주세요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: result.address,
          addressCode: result.code,
          // 요청사항은 필수 — qna는 타이핑 없이 조회 맥락으로 자동 작성
          message: `[위반건축물 지도에서 신청]\n조회 주소: ${result.address}\n조회 결과: ${
            result.violation === true
              ? '위반건축물 등재 확인'
              : result.violation === false
                ? '위반 등재 미확인'
                : '위반 조회 불가'
          }`,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || '상담 신청에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : '상담 신청 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pine, #15584a)', letterSpacing: '.04em' }}>
        무료상담 신청
      </div>
      <h3 style={{ margin: '6px 0 12px', fontSize: '1.2rem', fontWeight: 850, letterSpacing: '-.02em' }}>
        이 주소로 상담 신청할까요?
      </h3>

      <div
        style={{
          fontSize: 13,
          color: 'var(--ink-2, #4a524f)',
          background: 'var(--paper, #efe9dd)',
          borderRadius: 10,
          padding: '10px 12px',
          marginBottom: 14,
        }}
      >
        📍 {result.address}
      </div>

      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>이름</label>
      <input
        style={{ ...inputStyle, marginBottom: 12, ...(locked.name ? lockedInputStyle : {}) }}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={loadingProfile ? '불러오는 중…' : '홍길동'}
        autoComplete="name"
        disabled={locked.name || loadingProfile}
      />

      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>연락처</label>
      <input
        style={{ ...inputStyle, ...(locked.phone ? lockedInputStyle : {}) }}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={loadingProfile ? '불러오는 중…' : '010-1234-5678'}
        inputMode="tel"
        autoComplete="tel"
        disabled={locked.phone || loadingProfile}
      />

      {locked.name && locked.phone && (
        <div style={{ fontSize: 12, color: 'var(--ink-3, #7c8480)', marginTop: 8 }}>
          로그인 계정 정보로 자동 입력됐습니다.
        </div>
      )}

      {error && <div style={{ color: '#d8412f', fontSize: 13, marginTop: 10 }}>{error}</div>}

      <button
        type="submit"
        className="btn btn--pine"
        disabled={submitting || loadingProfile}
        style={{ width: '100%', marginTop: 16, opacity: submitting || loadingProfile ? 0.7 : 1 }}
      >
        {loadingProfile ? '불러오는 중…' : submitting ? '신청 중…' : '무료상담 신청하기'}
      </button>
    </form>
  );
}

function ConsultDone() {
  return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 6 }}>✅</div>
      <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 850 }}>상담 신청이 접수됐어요</h3>
      <p style={{ fontSize: 14, color: 'var(--ink-2, #4a524f)', lineHeight: 1.6 }}>
        담당자가 확인 후 빠르게 연락드리겠습니다.
      </p>
    </div>
  );
}
