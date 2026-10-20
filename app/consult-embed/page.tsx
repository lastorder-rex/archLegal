'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConsultationModal } from '@/components/landing/ConsultationModal';

// 단독 HTML 페이지(qna3d / qna3d-photo)에서 iframe 팝업으로 띄우는 상담 작성 창.
// 기존 ConsultationModal(폼·로그인·저장 /api/consultations)을 그대로 재사용한다.
// ?message= 로 상담 내용 프리필. 로그인은 상위창(window.top)으로 빠져 iframe OAuth 차단을 회피.
function ConsultEmbedInner() {
  const sp = useSearchParams();
  const message = sp.get('message') ?? '';
  const [open, setOpen] = useState(true);

  // 로그인 왕복 후 돌아올 상위 페이지(+팝업 재오픈 플래그)
  const nextPath = useMemo(() => {
    if (typeof window === 'undefined') return '/';
    try {
      const top = window.top ?? window;
      const u = new URL(top.location.href);
      u.searchParams.set('consult', 'open');
      return `${u.pathname}${u.search}`;
    } catch {
      return '/';
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    if (typeof window !== 'undefined') {
      (window.parent ?? window).postMessage({ type: 'consult-close' }, '*');
    }
  }, []);

  return (
    <ConsultationModal
      open={open}
      onClose={close}
      nextPath={nextPath}
      initialMessage={message}
      breakoutLogin
    />
  );
}

export default function ConsultEmbedPage() {
  return (
    <Suspense fallback={null}>
      <ConsultEmbedInner />
    </Suspense>
  );
}
