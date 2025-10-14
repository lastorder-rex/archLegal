'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk';
import { Button } from '@/components/ui/button';
import { useMyPageContext } from '@/components/mypage/MyPageContext';

type PaymentStageStatus = 'locked' | 'requested' | 'awaiting' | 'paid';

interface PaymentStageCard {
  id: string;
  title: string;
  description: string;
  amount?: number;
  status: PaymentStageStatus;
  updatedAt?: string;
  nextActionLabel?: string;
  disabled?: boolean;
}

type TossPaymentWidget = Awaited<ReturnType<typeof loadPaymentWidget>>;

type PaymentOrderState = {
  stageId: string;
  orderId: string;
  orderName: string;
  amount: number;
};

function createOrderId(stageId: string) {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 17); // up to milliseconds
  const random = Math.random().toString(36).slice(-6).toUpperCase();
  return `ORD-${timestamp}-${stageId}-${random}`;
}

export function MyPagePaymentsSection() {
  const { profile, fallbackEmail, consultations } = useMyPageContext();
  const [paymentAgreements, setPaymentAgreements] = useState<Record<string, boolean>>({});
  const [activePaymentStageId, setActivePaymentStageId] = useState<string | null>(null);
  const [paymentWidgetLoading, setPaymentWidgetLoading] = useState(false);
  const [paymentWidgetError, setPaymentWidgetError] = useState<string | null>(null);
  const [paymentWidgetOrder, setPaymentWidgetOrder] = useState<PaymentOrderState | null>(null);
  const paymentWidgetRef = useRef<TossPaymentWidget | null>(null);
  const activePaymentStageRef = useRef<string | null>(null);

  useEffect(() => {
    activePaymentStageRef.current = activePaymentStageId;
  }, [activePaymentStageId]);

  const paymentStages = useMemo<PaymentStageCard[]>(() => {
    const latestConsultation = consultations[0] ?? null;

    return [
      {
        id: 'stage-site-survey',
        title: '1단계 · 현장 답사 및 상담 비용',
        description: '현장 답사를 위한 기본 상담 수수료를 결제해주세요. 결제가 완료되어야 일정 조율이 진행됩니다.',
        amount: 88000,
        status: 'awaiting',
        updatedAt: latestConsultation?.created_at ?? undefined,
        nextActionLabel: '결제 진행'
      },
      {
        id: 'stage-legalization',
        title: '2단계 · 양성화 대행 서비스',
        description:
          '양성화 대행 계약이 확정되면 관리자가 결제를 활성화합니다. 활성화 전까지는 준비 상태로 표시됩니다.',
        amount: undefined,
        status: 'locked',
        nextActionLabel: '관리자 승인 대기',
        disabled: true
      }
    ];
  }, [consultations]);

  const paymentStatusLabel: Record<PaymentStageStatus, { text: string; className: string }> = {
    locked: { text: '활성화 대기', className: 'bg-slate-200 text-slate-700' },
    requested: { text: '결제 요청됨', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
    awaiting: { text: '결제 대기', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    paid: { text: '결제 완료', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
  };

  const resetPaymentWidget = useCallback((stageId?: string) => {
    const targetId = stageId ?? activePaymentStageRef.current ?? null;
    setActivePaymentStageId(prev => {
      if (!targetId) return null;
      return prev === targetId ? null : prev;
    });
    if (!targetId || activePaymentStageRef.current === targetId) {
      activePaymentStageRef.current = null;
    }
    setPaymentWidgetOrder(null);
    setPaymentWidgetError(null);
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

  const handlePaymentStart = useCallback(
    async (stage: PaymentStageCard) => {
      if (stage.disabled || stage.status === 'locked') {
        return;
      }

      if (!stage.amount || stage.amount <= 0) {
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

      setActivePaymentStageId(stage.id);
      activePaymentStageRef.current = stage.id;
      setPaymentWidgetLoading(true);
      setPaymentWidgetError(null);

      try {
        if (typeof window !== 'undefined') {
          await new Promise<void>(resolve => {
            window.requestAnimationFrame(() => resolve());
          });
        }

        const widget = await loadPaymentWidget(clientKey, customerKey);
        paymentWidgetRef.current = widget;

        await widget.renderPaymentMethods(`#payment-widget-${stage.id}`, stage.amount, {
          variantKey: 'DEFAULT'
        });
        await widget.renderAgreement(`#payment-agreement-${stage.id}`);

        setPaymentWidgetOrder({
          stageId: stage.id,
          orderId: createOrderId(stage.id),
          orderName: stage.title,
          amount: stage.amount
        });
      } catch (_error) {
        const error = _error as { message?: string; code?: string } | Error;
        console.error('[payment] widget load failed', error);
        const message =
          (typeof (error as any)?.message === 'string' && (error as any).message.length > 0
            ? (error as any).message
            : '결제 위젯 초기화에 실패했습니다.');
        const code = (error as any)?.code;
        setPaymentWidgetError(code ? `${message} (코드: ${code})` : message);
        resetPaymentWidget(stage.id);
      } finally {
        setPaymentWidgetLoading(false);
      }
    },
    [fallbackEmail, profile.auth_id, profile.email, resetPaymentWidget]
  );

  const handlePaymentSubmit = useCallback(async () => {
    if (
      !paymentWidgetRef.current ||
      !paymentWidgetOrder ||
      paymentWidgetOrder.stageId !== activePaymentStageRef.current
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
          amount: paymentWidgetOrder.amount
        }
      });
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
  }, [paymentWidgetOrder]);

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

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold">결제 내역</h2>
        <p className="text-sm text-muted-foreground">
          단계별 결제를 통해 양성화 서비스를 진행합니다. 결제 요청이 활성화되면 알림과 함께 카드가 열립니다.
        </p>
      </header>

      <div className="grid gap-4">
        {paymentStages.map(stage => {
          const statusMeta = paymentStatusLabel[stage.status];
          const isDisabled = stage.disabled || stage.status === 'locked';
          const requiresAgreement = stage.status === 'awaiting' || stage.status === 'requested';
          const isAgreed = paymentAgreements[stage.id] ?? false;
          const isCurrentStageActive = activePaymentStageId === stage.id;
          const isCurrentStageLoading = paymentWidgetLoading && isCurrentStageActive;
          const isButtonDisabled = isDisabled || (requiresAgreement && !isAgreed) || isCurrentStageLoading;
          const canSubmitPayment = paymentWidgetOrder?.stageId === stage.id && !paymentWidgetLoading;
          const agreementContent = (
            <>
              본 결제는 양성화 관련 전문 용역의 단계별 비용 결제임을 이해하고, 제공 범위·금액·환불 규정을 확인했습니다.{' '}
              <Link href="/refund-policy" className="text-primary underline underline-offset-2">
                환불 정책 보기
              </Link>
            </>
          );

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
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{stage.description}</p>
                </div>
                <div className="text-right">
                  {stage.amount ? (
                    <p className="text-lg font-semibold text-foreground">{stage.amount.toLocaleString()}원</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">금액은 관리자 안내 후 활성화됩니다.</p>
                  )}
                  {stage.updatedAt ? (
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
                      : stage.status === 'locked'
                        ? '관리자가 결제를 활성화하면 웹 알림과 함께 진행 가능해집니다.'
                        : '결제를 진행하면 서비스가 다음 단계로 이동합니다.'}
                  </p>
                  {requiresAgreement ? (
                    <label className={clsx('flex items-start gap-2 text-xs', isDisabled ? 'opacity-60' : undefined)}>
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border border-border accent-[hsl(var(--border))] focus-visible:outline-none focus-visible:ring-0"
                        checked={isAgreed}
                        onChange={event => handlePaymentAgreementToggle(stage.id, event.target.checked)}
                        disabled={isDisabled}
                      />
                      <span className="leading-snug">{agreementContent}</span>
                    </label>
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
                  onClick={() => handlePaymentStart(stage)}
                  aria-busy={isCurrentStageLoading}
                >
                  {isCurrentStageLoading ? '결제 준비 중...' : stage.nextActionLabel ?? '상세보기'}
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
                      id={`payment-widget-${stage.id}`}
                      className="min-h-[220px] rounded-lg border border-border bg-background p-4"
                    />
                    <div id={`payment-agreement-${stage.id}`} className="space-y-2" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePaymentWidgetClose(stage.id)}
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
    </section>
  );
}
