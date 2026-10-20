'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConsultationModal } from '@/components/landing/ConsultationModal';

export function RegionConsultationCta({ region }: { region: string }) {
  const [open, setOpen] = useState(false);
  const [nextPath, setNextPath] = useState('/region?consultation=open');

  useEffect(() => {
    const url = new URL(window.location.href);
    setNextPath(`${url.pathname}?consultation=open`);

    if (url.searchParams.get('consultation') === 'open') {
      setOpen(true);
      url.searchParams.delete('consultation');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const initialMessage = useMemo(
    () => `${region} 위반건축물 양성화와 이행강제금 관련 무료상담을 신청합니다.`,
    [region]
  );

  const openConsultation = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={openConsultation}
        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-base font-bold text-foreground transition hover:border-primary hover:text-primary"
      >
        무료 상담 신청
      </button>
      <ConsultationModal
        open={open}
        onClose={() => setOpen(false)}
        nextPath={nextPath}
        initialMessage={initialMessage}
      />
    </>
  );
}
