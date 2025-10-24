'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SupercoreLayout from '@/components/supercore/SupercoreLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Admin {
  id: string;
  username: string;
}

interface PaymentDetail {
  id: string;
  userId: string;
  consultationId: string | null;
  stageTemplateId: string;
  status: string;
  requestAmount: number | null;
  requestedAt: string | null;
  requestedBy: string | null;
  paidAmount: number | null;
  paidAt: string | null;
  paymentKey: string | null;
  updatedAt: string | null;
  stageTemplate: {
    id: string;
    stageOrder: number;
    code: string;
    title: string;
    description: string | null;
    defaultAmount: number | null;
  } | null;
  consultation: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    address_detail: string | null;
    created_at: string | null;
  } | null;
  requestedByAdmin: {
    id: string;
    username: string;
  } | null;
  driveFolder: {
    id: string;
    driveFolderId: string | null;
    driveFolderName: string | null;
    status: string | null;
    metadata: Record<string, unknown> | null;
    updatedAt: string | null;
  } | null;
}

const statusLabelMap: Record<string, string> = {
  awaiting: '결제 대기',
  requested: '요청됨',
  paid: '결제 완료',
  locked: '잠금'
};

interface UploadTokenRow {
  id: string;
  token: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  sentTo?: string | null;
  sentMethod?: string | null;
  sentAt?: string | null;
  uploadUrl: string;
}

function formatDateTime(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatAmount(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return '-';
  }
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(value);
}

export default function AdminPaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const paymentIdParam = params?.id;
  const paymentId = Array.isArray(paymentIdParam) ? paymentIdParam[0] : paymentIdParam;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [uploadTokens, setUploadTokens] = useState<UploadTokenRow[]>([]);
  const [lastCopiedTokenId, setLastCopiedTokenId] = useState<string | null>(null);

  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [paymentKeyInput, setPaymentKeyInput] = useState('');
  const [reopenReason, setReopenReason] = useState('');

  const loadPaymentDetail = useCallback(async () => {
    if (!paymentId) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || '결제 정보를 불러오지 못했습니다.');
        return;
      }

      const data = await response.json();
      const detail: PaymentDetail = data.payment;
      setPayment(detail);
      if (detail.paidAmount !== null) {
        setPaidAmountInput(String(detail.paidAmount));
      } else if (detail.requestAmount !== null) {
        setPaidAmountInput(String(detail.requestAmount));
      } else {
        setPaidAmountInput('');
      }
      setPaymentKeyInput(detail.paymentKey ?? '');
    } catch (error) {
      console.error('결제 상세 조회 오류', error);
      alert('결제 정보를 불러오는 중 오류가 발생했습니다.');
    }
  }, [paymentId]);

  const loadUploadTokens = useCallback(async () => {
    if (!paymentId) return;
    setIsTokenLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/upload-tokens`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error('업로드 토큰 조회 실패', data);
        return;
      }

      const data = await response.json();
      setUploadTokens(data.tokens ?? []);
    } catch (error) {
      console.error('업로드 토큰 조회 오류', error);
    } finally {
      setIsTokenLoading(false);
    }
  }, [paymentId]);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/auth/verify', {
        credentials: 'include'
      });

      if (!response.ok) {
        router.push('/supercore');
        return;
      }

      const data = await response.json();
      setAdmin(data.admin);
      setIsAuthenticated(true);
      await loadPaymentDetail();
      await loadUploadTokens();
    } catch (error) {
      console.error('관리자 인증 오류', error);
      router.push('/supercore');
    } finally {
      setIsLoading(false);
    }
  }, [loadPaymentDetail, loadUploadTokens, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleMarkPaid = async () => {
    if (!paymentId) return;
    if (!payment) return;

    const confirmed = window.confirm('해당 결제 단계를 "결제 완료" 상태로 변경하시겠습니까?');
    if (!confirmed) return;

    setIsActionLoading(true);
    try {
      const paidAmountValue = paidAmountInput.trim() !== '' ? Number(paidAmountInput) : undefined;
      const payload = {
        action: 'markPaid',
        paidAmount: Number.isFinite(paidAmountValue) ? paidAmountValue : undefined,
        paymentKey: paymentKeyInput.trim() !== '' ? paymentKeyInput.trim() : undefined
      };

      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || '결제 완료 처리 중 오류가 발생했습니다.');
        return;
      }

      setPayment(data.payment);
      if (data.payment?.paidAmount !== null) {
        setPaidAmountInput(String(data.payment.paidAmount));
      }
      if (data.payment?.paymentKey) {
        setPaymentKeyInput(data.payment.paymentKey);
      }
      await loadUploadTokens();
    } catch (error) {
      console.error('결제 완료 처리 오류', error);
      alert('결제 완료 처리 중 오류가 발생했습니다.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!paymentId) return;
    if (!payment) return;

    const confirmed = window.confirm('결제 완료 상태를 해제하고 다시 결제 대기 상태로 변경할까요?');
    if (!confirmed) return;

    setIsActionLoading(true);
    try {
      const payload = {
        action: 'reopen',
        reason: reopenReason.trim() || undefined
      };

      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || '결제 단계를 재오픈하는 중 오류가 발생했습니다.');
        return;
      }

      setPayment(data.payment);
      if (data.payment?.requestAmount !== null) {
        setPaidAmountInput(String(data.payment.requestAmount));
      } else {
        setPaidAmountInput('');
      }
      await loadUploadTokens();
    } catch (error) {
      console.error('결제 재오픈 오류', error);
      alert('결제 단계를 재오픈하는 중 오류가 발생했습니다.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateUploadToken = async () => {
    if (!paymentId) return;
    setIsTokenLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/upload-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || '업로드 링크 생성에 실패했습니다.');
        return;
      }

      if (data.token) {
        setUploadTokens((prev) => [data.token as UploadTokenRow, ...prev]);
        setLastCopiedTokenId(null);
      }
    } catch (error) {
      console.error('업로드 링크 생성 오류', error);
      alert('업로드 링크 생성 중 오류가 발생했습니다.');
    } finally {
      setIsTokenLoading(false);
    }
  };

  const handleCopyLink = async (token: UploadTokenRow) => {
    try {
      await navigator.clipboard.writeText(token.uploadUrl);
      setLastCopiedTokenId(token.id);
      setTimeout(() => setLastCopiedTokenId(null), 2000);
    } catch (error) {
      console.error('클립보드 복사 실패', error);
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SupercoreLayout title="결제 상세" onLogout={() => router.push('/supercore')}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button variant="ghost" onClick={() => router.push('/supercore/payments')}>
              ← 목록으로
            </Button>
            <h1 className="text-2xl font-semibold text-slate-900 mt-2">
              결제 단계 상세
            </h1>
            <p className="text-sm text-slate-500">결제 상태 및 문서 폴더 정보를 확인하고 관리할 수 있습니다.</p>
          </div>
          {payment && (
            <div className="flex flex-wrap gap-2">
              {payment.status !== 'paid' && (
                <Button onClick={handleMarkPaid} disabled={isActionLoading}>
                  결제 완료 처리
                </Button>
              )}
              {payment.status === 'paid' && (
                <Button variant="outline" onClick={handleReopen} disabled={isActionLoading}>
                  결제 단계 재오픈
                </Button>
              )}
            </div>
          )}
        </div>

        {!payment ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-500">
            결제 정보를 불러올 수 없습니다.
          </div>
        ) : (
          <div className="space-y-6">
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">결제 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">결제 단계</span>
                  <div className="mt-1 text-slate-900">{payment.stageTemplate?.title ?? '-'}</div>
                  <div className="text-xs text-slate-500">{payment.stageTemplate?.code ?? ''}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">요청 금액</span>
                  <div className="mt-1 text-slate-900">{formatAmount(payment.requestAmount)}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">확정 결제 금액</span>
                  <div className="mt-1 text-slate-900">{formatAmount(payment.paidAmount)}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">현재 상태</span>
                  <div className="mt-1 inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {statusLabelMap[payment.status] ?? payment.status}
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">요청 시각</span>
                  <div className="mt-1 text-slate-900">{formatDateTime(payment.requestedAt)}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">결제 완료 시각</span>
                  <div className="mt-1 text-slate-900">{formatDateTime(payment.paidAt)}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Toss Payment Key</span>
                  <div className="mt-1 text-slate-900 break-all">{payment.paymentKey || '-'}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">요청 관리자</span>
                  <div className="mt-1 text-slate-900">{payment.requestedByAdmin?.username ?? '-'}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paidAmount">결제 금액(수기 입력)</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                    placeholder="예: 5000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentKey">결제 식별값 (선택)</Label>
                  <Input
                    id="paymentKey"
                    value={paymentKeyInput}
                    onChange={(e) => setPaymentKeyInput(e.target.value)}
                    placeholder="Toss payment key 또는 기타 메모"
                  />
                </div>
              </div>

              {payment.status === 'paid' && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="reopenReason">재오픈 사유 (선택)</Label>
                  <Input
                    id="reopenReason"
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="재오픈 시 참고용 메모"
                  />
                </div>
              )}
            </section>

            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">상담 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">고객명</span>
                  <div className="mt-1 text-slate-900">{payment.consultation?.name ?? '-'}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">연락처</span>
                  <div className="mt-1 text-slate-900">{payment.consultation?.phone ?? '-'}</div>
                </div>
                <div className="md:col-span-2">
                  <span className="font-semibold text-slate-800">주소</span>
                  <div className="mt-1 text-slate-900">
                    {payment.consultation?.address ?? '-'}
                    {payment.consultation?.address_detail ? ` ${payment.consultation.address_detail}` : ''}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <span className="font-semibold text-slate-800">상담 생성일</span>
                  <div className="mt-1 text-slate-900">{formatDateTime(payment.consultation?.created_at ?? null)}</div>
                </div>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">문서 폴더 정보</h2>
              {payment.driveFolder ? (
                <div className="space-y-2 text-sm text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-800">폴더명</span>
                    <div className="mt-1 text-slate-900">{payment.driveFolder.driveFolderName ?? '-'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">상태</span>
                    <div className="mt-1 text-slate-900">{payment.driveFolder.status ?? '-'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">최종 동기화</span>
                    <div className="mt-1 text-slate-900">{formatDateTime(payment.driveFolder.updatedAt ?? null)}</div>
                  </div>
                  {payment.driveFolder.driveFolderId && (
                    <div>
                      <a
                        href={`https://drive.google.com/drive/folders/${payment.driveFolder.driveFolderId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Google Drive에서 열기
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">아직 생성된 문서 폴더 정보가 없습니다.</p>
              )}
            </section>

            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">업로드 링크</h2>
                  <p className="text-sm text-slate-500">결제 완료 고객에게 전달할 업로드 페이지 링크를 생성하고 관리합니다.</p>
                </div>
                <Button
                  onClick={handleCreateUploadToken}
                  disabled={isTokenLoading || payment.status !== 'paid'}
                >
                  업로드 링크 생성
                </Button>
              </div>
              {payment.status !== 'paid' && (
                <p className="text-sm text-amber-600 mb-4">
                  결제 완료 상태에서만 업로드 링크를 생성할 수 있습니다.
                </p>
              )}
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3">상태</th>
                      <th className="px-4 py-3">만료</th>
                      <th className="px-4 py-3">링크</th>
                      <th className="px-4 py-3">전송 대상</th>
                      <th className="px-4 py-3 text-right">동작</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isTokenLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-500">업로드 링크를 불러오는 중입니다...</td>
                      </tr>
                    ) : uploadTokens.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-500">생성된 업로드 링크가 없습니다.</td>
                      </tr>
                    ) : (
                      uploadTokens.map((token) => {
                        const expires = formatDateTime(token.expiresAt);
                        const statusLabel = token.status === 'expired' ? '만료' : token.status === 'revoked' ? '취소됨' : '활성';
                        return (
                          <tr key={token.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-900">{statusLabel}</td>
                            <td className="px-4 py-3 text-slate-700">{expires}</td>
                            <td className="px-4 py-3">
                              <div className="max-w-xs truncate text-slate-600">{token.uploadUrl}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{token.sentTo || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyLink(token)}
                              >
                                {lastCopiedTokenId === token.id ? '복사됨!' : '링크 복사'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </SupercoreLayout>
  );
}
