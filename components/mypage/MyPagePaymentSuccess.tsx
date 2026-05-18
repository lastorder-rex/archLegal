'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

type PaymentSuccessProps = {
  orderId?: string;
  paymentKey?: string;
  amount?: string;
};

type ConfirmStatus = 'idle' | 'pending' | 'success' | 'error';

export function MyPagePaymentSuccess({ orderId, paymentKey, amount }: PaymentSuccessProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConfirmStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsedAmount = useMemo(() => {
    if (!amount) return null;
    const value = Number(amount);
    return Number.isFinite(value) ? value : null;
  }, [amount]);

  useEffect(() => {
    if (!orderId || !paymentKey || parsedAmount === null) {
      if (!orderId || !paymentKey) {
        setErrorMessage('결제 승인 정보가 누락되었습니다. 지원팀에 문의해주세요.');
        setStatus('error');
      } else if (parsedAmount === null) {
        setErrorMessage('결제 금액 정보가 올바르지 않습니다.');
        setStatus('error');
      }
      return;
    }

    const controller = new AbortController();

    async function confirmPayment() {
      try {
        setStatus('pending');
        setErrorMessage(null);

        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            paymentKey,
            amount: parsedAmount
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setErrorMessage(data?.error || '결제 승인에 실패했습니다. 잠시 후 다시 시도해주세요.');
          setStatus('error');
          return;
        }

        setStatus('success');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('[MyPagePaymentSuccess] confirm error', error);
        setErrorMessage(
          error instanceof Error ? error.message : '결제 승인 요청 중 오류가 발생했습니다.'
        );
        setStatus('error');
      }
    }

    confirmPayment();

    return () => {
      controller.abort();
    };
  }, [orderId, paymentKey, parsedAmount]);

  useEffect(() => {
    if (status !== 'success') return;
    queryClient.invalidateQueries({ queryKey: ['payment-stages-all'] }).catch(() => undefined);
  }, [queryClient, status]);

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <header className="space-y-1">
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          결제 완료
        </span>
        <h2 className="text-xl font-semibold text-foreground">결제가 정상적으로 처리되었습니다.</h2>
        <p className="text-sm text-muted-foreground">
          결제 내역은 관리자 검토 후 안내됩니다. 결제 상세는 하단 버튼을 눌러 다시 확인할 수 있습니다.
        </p>
      </header>

      <ul className="space-y-2 text-sm text-foreground">
        {orderId ? (
          <li>
            <span className="font-semibold">주문번호</span> {orderId}
          </li>
        ) : null}
        {parsedAmount !== null ? (
          <li>
            <span className="font-semibold">결제금액</span> {parsedAmount.toLocaleString('ko-KR')}원
          </li>
        ) : null}
      </ul>

      <div className="space-y-3 rounded-xl border border-dashed border-emerald-200 bg-muted/30 p-4 text-sm text-foreground">
        {status === 'pending' ? (
          <p className="text-muted-foreground">결제 승인 정보를 확인하고 있습니다...</p>
        ) : status === 'success' ? (
          <p>결제 승인 정보가 정상적으로 반영되었습니다.</p>
        ) : errorMessage ? (
          <p className="text-destructive">{errorMessage}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/mypage/payments" className="inline-flex">
          <Button type="button">결제 내역으로 돌아가기</Button>
        </Link>
      </div>
    </section>
  );
}
