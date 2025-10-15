'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMyPageContext } from '@/components/mypage/MyPageContext';

export function MyPageConsultationsSection() {
  const router = useRouter();
  const { consultations: initialConsultations } = useMyPageContext();
  const [consultations, setConsultations] = useState(initialConsultations);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);

  useEffect(() => {
    setConsultations(initialConsultations);
  }, [initialConsultations]);

  const refreshConsultations = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/consultations', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('상담 내역을 갱신하지 못했습니다.');
      }
      const data = await response.json();
      if (Array.isArray(data.consultations)) {
        const nextConsultations = data.consultations as typeof initialConsultations;
        setConsultations(nextConsultations);
        if (
          selectedConsultationId &&
          !nextConsultations.some((item: typeof nextConsultations[number]) => item.id === selectedConsultationId)
        ) {
          setSelectedConsultationId(null);
        }
      }
    } catch (error) {
      console.error('[mypage] consultations refresh failed', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedConsultationId]);

  useEffect(() => {
    let mounted = true;
    refreshConsultations()
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          setIsRefreshing(false);
        }
      });

    const handler = () => {
      refreshConsultations();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('consultation-list-updated', handler);
    }

    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('consultation-list-updated', handler);
      }
    };
  }, [refreshConsultations]);

  const handleConsultationNavigate = useCallback(
    (id: string) => {
      router.push(`/request/history?id=${id}`);
    },
    [router]
  );

  const selectedConsultation = useMemo(
    () => consultations.find(item => item.id === selectedConsultationId) ?? null,
    [consultations, selectedConsultationId]
  );

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">상담 내역</h2>
            {isRefreshing ? (
              <span className="text-xs text-muted-foreground">업데이트 중...</span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">최근 상담 요청을 확인하고 필요한 상담을 선택해 상세 내용을 볼 수 있습니다.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedConsultation ? (
            <Button type="button" variant="outline" onClick={() => setSelectedConsultationId(null)}>
              상담 내역 목록으로
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => router.push('/request/history')}>
            상담 내역 페이지로 이동
          </Button>
        </div>
      </header>

      {consultations.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          아직 등록된 상담 내역이 없습니다. 상담을 진행하려면 상단의 무료 상담 신청 버튼을 이용해주세요.
        </p>
      ) : selectedConsultation ? (
        <article className="space-y-6 rounded-xl border border-border bg-secondary p-5 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              등록일 {new Date(selectedConsultation.created_at).toLocaleString('ko-KR')}
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              {selectedConsultation.address}
              {selectedConsultation.address_detail ? ` ${selectedConsultation.address_detail}` : ''}
            </h3>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            {selectedConsultation.phone ? (
              <div>
                <p className="text-muted-foreground">연락처</p>
                <p className="font-medium">{selectedConsultation.phone}</p>
              </div>
            ) : null}
            {selectedConsultation.email ? (
              <div>
                <p className="text-muted-foreground">이메일</p>
                <p className="font-medium">{selectedConsultation.email}</p>
              </div>
            ) : null}
            <div>
              <p className="text-muted-foreground">주용도</p>
              <p className="font-medium">{selectedConsultation.main_purps ?? '정보 없음'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">연면적</p>
              <p className="font-medium">
                {selectedConsultation.tot_area ? `${selectedConsultation.tot_area.toLocaleString()}㎡` : '정보 없음'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">대지면적</p>
              <p className="font-medium">
                {selectedConsultation.plat_area ? `${selectedConsultation.plat_area.toLocaleString()}㎡` : '정보 없음'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">지상층수</p>
              <p className="font-medium">{selectedConsultation.ground_floor_cnt ?? '정보 없음'}</p>
            </div>
          </div>

          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">상담 요청 내용</h4>
            <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted/10 p-4 text-sm text-foreground">
              {selectedConsultation.message ?? '상담 요청 메시지가 없습니다.'}
            </div>
          </section>

          {!!selectedConsultation.attachments?.length && (
            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">첨부파일</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {selectedConsultation.attachments.map((attachment, index) => (
                  <li key={`${attachment.storagePath}-${index}`} className="rounded border border-border px-3 py-2">
                    {attachment.name}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      ) : (
        <div className="space-y-4">
          {consultations.map(item => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-card p-4 shadow-md transition hover:border-primary hover:ring-2 hover:ring-primary hover:ring-opacity-40"
            >
              <header
                role="button"
                tabIndex={0}
                onClick={() => handleConsultationNavigate(item.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleConsultationNavigate(item.id);
                  }
                }}
                className="flex cursor-pointer flex-col gap-1 transition hover:text-primary sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground" style={{ pointerEvents: 'none' }}>
                    {item.address}
                    {item.address_detail ? ` ${item.address_detail}` : ''}
                  </h3>
                 
                </div>
                <time className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString('ko-KR')}
                </time>
              </header>
              {item.message ? (
                <p
                  className="mt-3 cursor-pointer text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap"
                  onClick={() => handleConsultationNavigate(item.id)}
                >
                  {item.message}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">작성된 상담 내용이 없습니다.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
