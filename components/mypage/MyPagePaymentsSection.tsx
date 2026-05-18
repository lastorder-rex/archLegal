'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useMyPageContext } from '@/components/mypage/MyPageContext';
import { paymentStagesResponseSchema, type PaymentStage } from '@/lib/validations/payment';
import { isAtLeastAge } from '@/lib/validations/user';

type TossPayments = Awaited<ReturnType<typeof loadTossPayments>>;
type PaymentWidget = Awaited<ReturnType<TossPayments['widgets']>>;

type PaymentOrderState = {
  stageId: string;
  consultationId: string;
  uniqueStageKey: string;
  orderId: string;
  orderName: string;
  amount: number;
};

function createOrderId(stageId: string, consultationId?: string) {
  const timePart = Date.now().toString(36).toUpperCase();
  const sanitize = (value: string, fallback: string) => {
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase();
    return cleaned.length > 0 ? cleaned : fallback;
  };
  const stagePart = sanitize(stageId, 'STAGE');
  const consultationPart = consultationId ? sanitize(consultationId, 'CONSULT') : null;
  const randomPart = Math.random().toString(36).slice(-6).toUpperCase();
  return consultationPart
    ? `ORD-${timePart}-${stagePart}-${consultationPart}-${randomPart}`
    : `ORD-${timePart}-${stagePart}-${randomPart}`;
}

type ConsultationWithStages = {
  consultation: {
    id: string;
    nickname: string | null;
    name: string | null;
    address: string | null;
    addressDetail: string | null;
    createdAt: string;
  };
  stages: PaymentStage[];
};

export function MyPagePaymentsSection() {
  const { profile, fallbackEmail } = useMyPageContext();
  const queryClient = useQueryClient();
  const [paymentAgreements, setPaymentAgreements] = useState<Record<string, boolean>>({});
  const [ageConfirmations, setAgeConfirmations] = useState<Record<string, boolean>>({});
  const [ageErrors, setAgeErrors] = useState<Record<string, string | null>>({});
  const [activePaymentStageId, setActivePaymentStageId] = useState<string | null>(null);
  const [paymentWidgetLoading, setPaymentWidgetLoading] = useState(false);
  const [paymentWidgetError, setPaymentWidgetError] = useState<string | null>(null);
  const [paymentWidgetOrder, setPaymentWidgetOrder] = useState<PaymentOrderState | null>(null);
  const paymentWidgetRef = useRef<PaymentWidget | null>(null);
  const activePaymentStageRef = useRef<string | null>(null);

  useEffect(() => {
    activePaymentStageRef.current = activePaymentStageId;
  }, [activePaymentStageId]);

  const {
    data: consultationsWithStages = [],
    refetch: refetchPaymentStages,
    isLoading: paymentStagesLoading,
    isFetching: paymentStagesFetching,
    error: paymentStagesError
  } = useQuery<ConsultationWithStages[]>({
    queryKey: ['payment-stages-all'],
    queryFn: async () => {
      const response = await fetch('/api/payments/stages', { credentials: 'include' });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json?.error || '결제 단계 정보를 불러오지 못했습니다.');
      }
      const json = await response.json();
      return json.consultationsWithStages ?? [];
    },
    staleTime: 1000 * 30
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handler = () => {
      refetchPaymentStages().catch(() => undefined);
    };

    window.addEventListener('consultation-list-updated', handler);
    return () => {
      window.removeEventListener('consultation-list-updated', handler);
    };
  }, [refetchPaymentStages]);

  const paymentStatusLabel: Record<PaymentStage['status'], { text: string; className: string }> = {
    locked: { text: '활성화 대기', className: 'bg-slate-200 text-slate-700' },
    requested: { text: '결제 요청됨', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
    awaiting: { text: '결제 대기', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    paid: { text: '결제 완료', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    canceled: { text: '결제 취소됨', className: 'bg-red-50 text-red-700 border border-red-200' }
  };

  const resetPaymentWidget = useCallback((stageId?: string, options?: { preserveActive?: boolean; preserveError?: boolean }) => {
    const targetId = stageId ?? activePaymentStageRef.current ?? null;

    if (!options?.preserveActive) {
      setActivePaymentStageId(prev => {
        if (!targetId) return null;
        return prev === targetId ? null : prev;
      });
      if (!targetId || activePaymentStageRef.current === targetId) {
        activePaymentStageRef.current = null;
      }
    }

    setPaymentWidgetOrder(null);
    if (!options?.preserveError) {
      setPaymentWidgetError(null);
    }
    setPaymentWidgetLoading(false);
    paymentWidgetRef.current = null;

    if (typeof window === 'undefined' || !targetId) {
      return;
    }

    const widgetContainer = document.getElementById(`payment-widget-${targetId}`);
    if (widgetContainer) {
      widgetContainer.innerHTML = '';
    }

    const agreementContainer = document.getElementById(`payment-agreement-${targetId}`);
    if (agreementContainer) {
      agreementContainer.innerHTML = '';
    }
  }, []);

  const handlePaymentAgreementToggle = useCallback((stageId: string, checked: boolean) => {
    setPaymentAgreements(prev => ({ ...prev, [stageId]: checked }));
  }, []);

  const validateAgeRequirement = useCallback(() => {
    const birthDateStr = profile.birth_date;
    if (!birthDateStr) {
      return {
        valid: false,
        message: '생년월일 정보가 없습니다. 마이페이지에서 먼저 입력해주세요.'
      };
    }

    const birthDate = new Date(`${birthDateStr}T00:00:00`);
    if (Number.isNaN(birthDate.getTime())) {
      return {
        valid: false,
        message: '생년월일 형식이 올바르지 않습니다. 마이페이지에서 다시 저장해주세요.'
      };
    }

    if (!isAtLeastAge(birthDateStr, 14)) {
      return { valid: false, message: '만 14세 이상이 아닙니다.' };
    }

    return { valid: true, message: null };
  }, [profile.birth_date]);

  useEffect(() => {
    setAgeConfirmations({});
    setAgeErrors({});
  }, [profile.birth_date]);

  const handleAgeConfirmationToggle = useCallback(
    (stageId: string, checked: boolean) => {
      if (!checked) {
        setAgeConfirmations(prev => ({ ...prev, [stageId]: false }));
        setAgeErrors(prev => ({ ...prev, [stageId]: null }));
        return;
      }

      const result = validateAgeRequirement();
      if (!result.valid) {
        setAgeConfirmations(prev => ({ ...prev, [stageId]: false }));
        setAgeErrors(prev => ({ ...prev, [stageId]: result.message ?? '만 14세 이상 확인에 실패했습니다.' }));
        return;
      }

      setAgeErrors(prev => ({ ...prev, [stageId]: null }));
      setAgeConfirmations(prev => ({ ...prev, [stageId]: true }));
    },
    [validateAgeRequirement]
  );

  const handlePaymentStart = useCallback(
    async (stage: PaymentStage, consultationId: string, uniqueStageKey: string) => {
      if (stage.status === 'paid') {
        setPaymentWidgetError('이미 결제 완료된 단계입니다.');
        return;
      }

      if (stage.status === 'canceled') {
        setPaymentWidgetError('취소된 결제 단계입니다. 새로운 상담을 신청해주세요.');
        return;
      }

      if (stage.disabled || stage.status === 'locked') {
        return;
      }

      const requiresAgreement = stage.status === 'awaiting' || stage.status === 'requested';
      if (requiresAgreement) {
        const ageConfirmed = ageConfirmations[uniqueStageKey] ?? false;
        const agreementChecked = paymentAgreements[uniqueStageKey] ?? false;

        if (!ageConfirmed) {
          const ageCheck = validateAgeRequirement();
          setAgeErrors(prev => ({
            ...prev,
            [uniqueStageKey]: ageCheck.valid ? '만 14세 이상임을 체크한 뒤 진행해주세요.' : ageCheck.message ?? '만 14세 이상이 아닙니다.'
          }));
          setPaymentWidgetError(ageCheck.valid ? '만 14세 이상임을 체크해주세요.' : ageCheck.message ?? '만 14세 이상이 아닙니다.');
          return;
        } else {
          setAgeErrors(prev => {
            if (!prev[uniqueStageKey]) return prev;
            const next = { ...prev };
            next[uniqueStageKey] = null;
            return next;
          });
        }

        if (!agreementChecked) {
          setPaymentWidgetError('결제 전 안내 사항에 동의해주세요.');
          return;
        }
      }

      const payableAmount = stage.requestAmount;
      if (!payableAmount || payableAmount <= 0) {
        setPaymentWidgetError('결제 금액 정보가 없습니다. 담당자에게 문의해주세요.');
        return;
      }

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        setPaymentWidgetError('Toss Payments 클라이언트 키가 설정되어 있지 않습니다.');
        return;
      }

      const customerKey =
        profile.auth_id ??
        profile.email ??
        fallbackEmail ??
        `anonymous-${stage.id}`;

      resetPaymentWidget();

      setActivePaymentStageId(uniqueStageKey);
      activePaymentStageRef.current = uniqueStageKey;
      setPaymentWidgetLoading(true);
      setPaymentWidgetError(null);

      try {
        if (typeof window !== 'undefined') {
          await new Promise<void>(resolve => {
            window.requestAnimationFrame(() => resolve());
          });
        }

        const tossPayments = await loadTossPayments(clientKey);
        const widget = await tossPayments.widgets({ customerKey });
        paymentWidgetRef.current = widget;

        // Set payment amount first
        await widget.setAmount({ value: payableAmount, currency: 'KRW' });

        await widget.renderPaymentMethods({
          selector: `#payment-widget-${uniqueStageKey}`,
          variantKey: 'DEFAULT'
        });
        await widget.renderAgreement({
          selector: `#payment-agreement-${uniqueStageKey}`,
          variantKey: 'AGREEMENT'
        });

        setPaymentWidgetOrder({
          stageId: stage.id,
          consultationId,
          uniqueStageKey,
          orderId: createOrderId(stage.id, consultationId),
          orderName: stage.title,
          amount: payableAmount
        });
      } catch (_error) {
        const error = _error as { message?: string; code?: string } | Error;
        console.error('[payment] widget load failed', error);
        const message =
          (typeof (error as any)?.message === 'string' && (error as any).message.length > 0
            ? (error as any).message
            : '결제 위젯 초기화에 실패했습니다.');
        const code = (error as any)?.code;
        setPaymentWidgetOrder(null);
        setPaymentWidgetError(code ? `${message} (코드: ${code})` : message);
        resetPaymentWidget(uniqueStageKey, { preserveActive: true, preserveError: true });
      } finally {
        setPaymentWidgetLoading(false);
      }
    },
    [
      ageConfirmations,
      paymentAgreements,
      fallbackEmail,
      profile.auth_id,
      profile.email,
      resetPaymentWidget,
      validateAgeRequirement
    ]
  );

  const handlePaymentSubmit = useCallback(async () => {
    if (
      !paymentWidgetRef.current ||
      !paymentWidgetOrder ||
      paymentWidgetOrder.uniqueStageKey !== activePaymentStageRef.current
    ) {
      setPaymentWidgetError('결제 정보를 불러온 뒤 다시 시도해주세요.');
      return;
    }

    try {
      setPaymentWidgetLoading(true);
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL ?? '';
      const successUrl = `${origin}/mypage/payments/success`;
      const failUrl = `${origin}/mypage/payments/fail`;

      await paymentWidgetRef.current.requestPayment({
        orderId: paymentWidgetOrder.orderId,
        orderName: paymentWidgetOrder.orderName,
        successUrl,
        failUrl,
        metadata: {
          amount: paymentWidgetOrder.amount,
          stageTemplateId: paymentWidgetOrder.stageId,
          consultationId: paymentWidgetOrder.consultationId
        }
      });
      queryClient.invalidateQueries({ queryKey: ['payment-stages-all'] }).catch(() => undefined);
    } catch (_error) {
      const error = _error as { message?: string; code?: string } | Error;
      console.error('[payment] requestPayment failed', error);
      const message =
        (typeof (error as any)?.message === 'string' && (error as any).message.length > 0
          ? (error as any).message
          : '결제 요청 중 문제가 발생했습니다.');
      const code = (error as any)?.code;
      setPaymentWidgetError(code ? `${message} (코드: ${code})` : message);
      setPaymentWidgetLoading(false);
    }
  }, [paymentWidgetOrder, queryClient]);

  const handlePaymentWidgetClose = useCallback(
    (stageId?: string) => {
      resetPaymentWidget(stageId);
    },
    [resetPaymentWidget]
  );

  useEffect(() => {
    return () => {
      resetPaymentWidget();
    };
  }, [resetPaymentWidget]);

  const stagesLoading = paymentStagesLoading || paymentStagesFetching;
  const stagesErrorMessage = paymentStagesError instanceof Error ? paymentStagesError.message : null;

  // 상담글이 없는 경우
  if (!stagesLoading && consultationsWithStages.length === 0) {
    return (
      <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <header className="space-y-2">
          <h2 className="text-xl font-semibold">결제 내역</h2>
          <p className="text-sm text-muted-foreground">
            결제 내역을 확인하려면 먼저 상담 신청을 해주세요.
          </p>
        </header>
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          아직 등록된 상담 내역이 없습니다. 상단의 무료 상담 신청 버튼을 이용해주세요.
        </p>
      </section>
    );
  }

  if (stagesLoading) {
    return (
      <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <header className="space-y-2">
          <h2 className="text-xl font-semibold">결제 내역</h2>
          <p className="text-sm text-muted-foreground">결제 단계를 불러오는 중입니다...</p>
        </header>
        <p className="text-sm text-muted-foreground">잠시만 기다려주세요.</p>
      </section>
    );
  }

  if (stagesErrorMessage) {
    return (
      <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <header className="space-y-2">
          <h2 className="text-xl font-semibold">결제 내역</h2>
          <p className="text-sm text-destructive">{stagesErrorMessage}</p>
        </header>
        <Button
          type="button"
          onClick={() => {
            refetchPaymentStages().catch(() => undefined);
          }}
        >
          다시 불러오기
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold">결제 내역</h2>
        <p className="text-sm text-muted-foreground">
          단계별 결제를 통해 양성화 서비스를 진행합니다. 결제 요청이 활성화되면 알림과 함께 카드가 열립니다.
        </p>
      </header>

      {/* 각 상담글마다 결제 단계 표시 */}
      <div className="space-y-8">
        {consultationsWithStages.map(({ consultation, stages }) => (
          <div key={consultation.id} className="space-y-4">
            {/* 상담글 헤더 */}
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {consultation.address || '주소 정보 없음'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {consultation.nickname || consultation.name || '이름 없음'} • 등록일:{' '}
                    {new Date(consultation.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>

            {/* 결제 단계 카드들 */}
            <div className="grid gap-4">
              {stages.map(stage => {
          // 상담글별로 고유한 키 생성 (consultation.id + stage.id)
          const uniqueStageKey = `${consultation.id}-${stage.id}`;
          const statusMeta = paymentStatusLabel[stage.status];
          const isPaid = stage.status === 'paid';
          const isCanceled = stage.status === 'canceled';
          const isDisabled = stage.disabled || stage.status === 'locked' || isPaid || isCanceled;
          const requiresAgreement = stage.status === 'awaiting' || stage.status === 'requested';
          const isAgreed = paymentAgreements[uniqueStageKey] ?? false;
          const isAgeConfirmed = ageConfirmations[uniqueStageKey] ?? false;
          const ageError = ageErrors[uniqueStageKey] ?? null;
          const isCurrentStageActive = activePaymentStageId === uniqueStageKey;
          const isCurrentStageLoading = paymentWidgetLoading && isCurrentStageActive;
          const isButtonDisabled =
            isDisabled || (requiresAgreement && (!isAgreed || !isAgeConfirmed)) || isCurrentStageLoading;
          const canSubmitPayment =
            paymentWidgetOrder?.uniqueStageKey === uniqueStageKey && !paymentWidgetLoading && !isPaid;
          const buttonLabel = isPaid ? '결제 완료' : isCanceled ? '취소됨' : stage.nextActionLabel ?? '상세보기';
          const agreementContent = (
            <>
              본 결제는 양성화 관련 전문 용역의 단계별 비용 결제임을 이해하고, 제공 범위·금액·환불 규정을 확인했습니다.(필수){' '}
              <Link href="/refund-policy" className="text-primary underline underline-offset-2">
                환불 정책 보기
              </Link>
            </>
          );
          const displayAmount = stage.requestAmount ?? null;

          return (
            <article
              key={stage.id}
              className={clsx(
                'space-y-4 rounded-xl border border-border bg-secondary/40 p-5 shadow-sm transition',
                !isDisabled && 'hover:border-primary hover:shadow-md'
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{stage.title}</h3>
                    <span
                      className={clsx(
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                        statusMeta.className
                      )}
                    >
                      {statusMeta.text}
                      {isCanceled && stage.canceledAt ? (
                        <span className="ml-1">
                          ({new Date(stage.canceledAt).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })})
                        </span>
                      ) : null}
                    </span>
                  </div>
                  {stage.description ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{stage.description}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  {displayAmount ? (
                    <p className="text-lg font-semibold text-foreground">{displayAmount.toLocaleString()}원</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">금액은 관리자 안내 후 활성화됩니다.</p>
                  )}
                  {stage.requestedAt ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      요청일: {new Date(stage.requestedAt).toLocaleString('ko-KR')}
                    </p>
                  ) : stage.updatedAt ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      업데이트: {new Date(stage.updatedAt).toLocaleString('ko-KR')}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-1 flex-col gap-2 text-xs text-muted-foreground">
                  <p>
                    {stage.status === 'paid'
                      ? '결제가 완료되었습니다. 추가 안내는 담당자가 별도로 연락드립니다.'
                      : stage.status === 'canceled'
                        ? '관리자에 의해 결제가 취소되었습니다. 새로운 상담 신청이 필요한 경우 담당자에게 문의해주세요.'
                        : stage.status === 'locked'
                          ? '관리자가 결제를 활성화하면 웹 알림과 함께 진행 가능해집니다.'
                          : '결제를 진행하면 서비스가 다음 단계로 이동합니다.'}
                  </p>
                  {requiresAgreement ? (
                    <div className="flex flex-col gap-2">
                      <label className={clsx('flex items-start gap-2 text-xs', isDisabled ? 'opacity-60' : undefined)}>
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border border-border accent-[hsl(var(--border))] focus-visible:outline-none focus-visible:ring-0"
                          checked={isAgeConfirmed}
                          onChange={event => handleAgeConfirmationToggle(uniqueStageKey, event.target.checked)}
                          disabled={isDisabled}
                        />
                        <span className="leading-snug">만 14세 이상입니다.(필수)</span>
                      </label>
                      {ageError ? <p className="text-xs text-destructive">{ageError}</p> : null}
                      <label className={clsx('flex items-start gap-2 text-xs', isDisabled ? 'opacity-60' : undefined)}>
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border border-border accent-[hsl(var(--border))] focus-visible:outline-none focus-visible:ring-0"
                          checked={isAgreed}
                          onChange={event => handlePaymentAgreementToggle(uniqueStageKey, event.target.checked)}
                          disabled={isDisabled}
                        />
                        <span className="leading-snug">{agreementContent}</span>
                      </label>
                    </div>
                  ) : stage.status !== 'paid' ? (
                    <p className={clsx('text-xs leading-snug text-muted-foreground', isDisabled ? 'opacity-60' : undefined)}>
                      {agreementContent}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant={isDisabled ? 'outline' : 'primary'}
                  disabled={isButtonDisabled}
                  onClick={() => handlePaymentStart(stage, consultation.id, uniqueStageKey)}
                  aria-busy={isCurrentStageLoading}
                >
                  {isCurrentStageLoading ? '결제 준비 중...' : buttonLabel}
                </Button>
              </div>

              {isCurrentStageActive ? (
                <div className="space-y-3 rounded-xl border border-dashed border-primary/40 bg-card p-4">
                  {paymentWidgetError ? (
                    <p className="text-sm text-destructive">{paymentWidgetError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">결제 수단을 선택한 뒤 아래 결제 요청 버튼을 눌러주세요.</p>
                  )}
                  <div className="space-y-4">
                    <div
                      id={`payment-widget-${uniqueStageKey}`}
                      className="min-h-[220px] rounded-lg border border-border bg-background p-4"
                    />
                    <div id={`payment-agreement-${uniqueStageKey}`} className="space-y-2" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePaymentWidgetClose(uniqueStageKey)}
                      disabled={paymentWidgetLoading}
                    >
                      닫기
                    </Button>
                    <Button type="button" size="sm" onClick={handlePaymentSubmit} disabled={!canSubmitPayment}>
                      {paymentWidgetLoading ? '처리 중...' : '결제 요청'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </article>
              );
            })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
