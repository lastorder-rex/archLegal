'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFileUrl } from '@/lib/utils/file-upload';
import SupercoreLayout from '@/components/supercore/SupercoreLayout';
import AdminLoadingScreen from '@/components/supercore/AdminLoadingScreen';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface Consultation {
  id: string;
  user_id: string;
  nickname: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  address_detail: string | null;
  address_code: any;
  building_info: any;
  main_purps: string;
  tot_area: number | null;
  plat_area: number | null;
  ground_floor_cnt: number | null;
  message: string | null;
  attachments: any[];
  created_at: string;
  updated_at: string;
}

type PaymentStageStatus = 'locked' | 'requested' | 'awaiting' | 'paid';

interface PaymentStage {
  stageTemplateId: string;
  stageOrder: number;
  code: string;
  title: string;
  description: string | null;
  defaultAmount: number | null;
  status: PaymentStageStatus;
  requestAmount: number | null;
  requestedAt: string | null;
  requestedBy: string | null;
  paidAt: string | null;
  paidAmount: number | null;
  paymentKey: string | null;
  updatedAt: string | null;
}

const stageStatusMeta: Record<PaymentStageStatus, { text: string; className: string }> = {
  locked: { text: '비활성', className: 'bg-slate-200 text-slate-700' },
  requested: { text: '결제 요청됨', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  awaiting: { text: '결제 요청됨', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  paid: { text: '결제 완료', className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' }
};

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  return `${value.toLocaleString('ko-KR')}원`;
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR');
};

export default function ConsultationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const consultationId = params.id as string;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoadingConsultation, setIsLoadingConsultation] = useState(false);
  const [paymentStages, setPaymentStages] = useState<PaymentStage[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [requestAmountInput, setRequestAmountInput] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [cancellingStageId, setCancellingStageId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const downloadAttachment = async (attachment: { name: string; size: number; type: string; storagePath: string }) => {
    try {
      const result = await getFileUrl(attachment.storagePath);
      if (!result.url) {
        alert(`다운로드 실패: ${result.error}`);
        return;
      }

      const response = await fetch(result.url);
      if (!response.ok) throw new Error('파일 다운로드에 실패했습니다.');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Download error:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleOpenRoadview = (provider: 'kakao' | 'naver') => {
    if (!consultation) return;
    // 지도 검색은 상세주소보다 기본 주소가 더 안정적입니다.
    const encodedAddress = encodeURIComponent(consultation.address);
    const url =
      provider === 'kakao'
        ? `https://map.kakao.com/?map_type=TYPE_ROADVIEW&q=${encodedAddress}`
        : `https://map.naver.com/v5/search/${encodedAddress}?searchCoord=0,0,15,0,0,0`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const loadConsultation = useCallback(async () => {
    setIsLoadingConsultation(true);
    try {
      const response = await fetch(`/api/admin/consultations/${consultationId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Failed to load consultation');
        alert('상담 내역을 불러올 수 없습니다.');
        router.push('/supercore/consultations');
        return;
      }

      const data = await response.json();
      setConsultation(data.consultation);
      setPaymentStages(data.paymentStages ?? []);
    } catch (error) {
      console.error('Load consultation error:', error);
      alert('상담 내역을 불러오는 중 오류가 발생했습니다.');
      router.push('/supercore/consultations');
    } finally {
      setIsLoadingConsultation(false);
    }
  }, [consultationId, router]);

  const handleAuthReady = useCallback(() => loadConsultation(), [loadConsultation]);
  const { isCheckingAuth } = useAdminAuth({ onReady: handleAuthReady });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const requestableStages = useMemo(() => {
    if (!paymentStages.length) return [];
    return paymentStages.filter(stage => {
      if (stage.status !== 'locked') return false;
      const prerequisites = paymentStages.filter(item => item.stageOrder < stage.stageOrder);
      return prerequisites.every(item => item.status === 'paid');
    });
  }, [paymentStages]);

  const openPaymentDialog = () => {
    if (!requestableStages.length) {
      setToast({
        type: 'info',
        message: '결제 요청은 기존 요청을 취소하거나 이전 단계 결제가 완료된 이후 가능합니다.'
      });
      return;
    }
    const targetStage = requestableStages[0];
    setSelectedStageId(targetStage.stageTemplateId);

    // 기본 금액이 있으면 자동으로 채워줌
    if (targetStage.defaultAmount && targetStage.defaultAmount > 0) {
      setRequestAmountInput(targetStage.defaultAmount.toLocaleString('ko-KR'));
    } else {
      setRequestAmountInput('');
    }

    setErrorMessage(null);
    setPaymentDialogOpen(true);
  };
  const handlePaymentRequestSubmit = async () => {
    if (!selectedStageId) {
      setErrorMessage('결제 단계를 선택해주세요.');
      return;
    }

    const numericAmount = Number(requestAmountInput.replace(/[^0-9]/g, ''));
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('유효한 결제 금액을 입력해주세요.');
      return;
    }

    setPaymentSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/consultations/${consultationId}/payment-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          stageTemplateId: selectedStageId,
          amount: numericAmount
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || '결제 요청에 실패했습니다.');
      }

      const data = await response.json();
      const updatedStage: PaymentStage = data.paymentStage;

      setPaymentStages(prev =>
        prev.map(stage =>
          stage.stageTemplateId === updatedStage.stageTemplateId ? { ...stage, ...updatedStage } : stage
        )
      );

      setPaymentDialogOpen(false);
      setErrorMessage(null);
      const formattedAmount = numericAmount.toLocaleString('ko-KR');
      setToast({
        type: 'success',
        message: `${consultation?.name ?? '사용자'}님께 ${formattedAmount}원 결제 요청되었습니다.`
      });
    } catch (error: any) {
      console.error('Payment request submit error', error);
      setErrorMessage(error.message || '결제 요청 중 오류가 발생했습니다.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleCancelPaymentRequest = async (stageTemplateId: string) => {
    setCancellingStageId(stageTemplateId);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/consultations/${consultationId}/payment-request`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stageTemplateId })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || '결제 요청 취소에 실패했습니다.');
      }

      setPaymentStages(prev =>
        prev.map(stage =>
          stage.stageTemplateId === stageTemplateId
            ? {
                ...stage,
                status: 'locked',
                requestAmount: null,
                requestedAt: null,
                requestedBy: null,
                paidAt: null,
                paidAmount: null,
                paymentKey: null,
                updatedAt: new Date().toISOString()
              }
            : stage
        )
      );
      setToast({ type: 'info', message: '결제 요청이 취소되었습니다.' });
    } catch (error: any) {
      console.error('Payment cancel error', error);
      setErrorMessage(error.message || '결제 요청 취소 중 오류가 발생했습니다.');
    } finally {
      setCancellingStageId(null);
    }
  };

  if (isCheckingAuth || isLoadingConsultation) {
    return <AdminLoadingScreen />;
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-lg">상담 내역을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <SupercoreLayout title="상담 상세">
      <div className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">접수일시</p>
              <p className="text-base font-medium text-slate-900">
                {new Date(consultation.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">카카오 닉네임</p>
              <p className="text-base font-medium text-slate-900">{consultation.nickname}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">실명</p>
              <p className="text-base font-medium text-slate-900">{consultation.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">연락처</p>
              <p className="text-base font-medium text-slate-900">{consultation.phone}</p>
            </div>
            {consultation.email && (
              <div className="md:col-span-2">
                <p className="text-sm text-slate-600">이메일</p>
                <p className="text-base font-medium text-slate-900">{consultation.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* 주소 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">주소 정보</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">주소</p>
              <p className="text-base font-medium text-slate-900">{consultation.address}</p>
              {consultation.address_detail ? (
                <p className="text-sm text-slate-700 mt-1">{consultation.address_detail}</p>
              ) : null}
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">로드뷰 확인</h4>
                <p className="text-xs text-muted-foreground">
                  지도에서 로드뷰를 열어 주변 현황을 확인할 수 있습니다.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => handleOpenRoadview('kakao')}>
                  카카오 로드뷰 열기
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleOpenRoadview('naver')}>
                  네이버 로드뷰 열기
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 상담 내용 */}
        {consultation.message && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">상담 요청사항</h2>
            <p className="text-base text-slate-700 whitespace-pre-wrap">{consultation.message}</p>
          </div>
        )}

        {/* 첨부파일 */}
        {consultation.attachments && consultation.attachments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">첨부파일</h2>
            <div className="space-y-2">
              {consultation.attachments.map((file, index) => (
                <button
                  key={index}
                  onClick={() => downloadAttachment(file)}
                  className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors group w-full text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 결제 단계 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">결제 단계 관리</h2>
          <div className="space-y-4">
            {paymentStages.length === 0 ? (
              <p className="text-sm text-slate-600">결제 단계 정보가 아직 준비되지 않았습니다.</p>
            ) : (
              paymentStages.map(stage => {
                const statusMeta = stageStatusMeta[stage.status] ?? stageStatusMeta.locked;
                return (
                  <div key={stage.stageTemplateId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          단계 {stage.stageOrder}
                        </p>
                        <p className="text-base font-semibold text-slate-900">{stage.title}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusMeta.className}`}>
                          {statusMeta.text}
                        </span>
                        {stage.status !== 'locked' && stage.status !== 'paid' ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="sm:w-auto w-full"
                            onClick={() => handleCancelPaymentRequest(stage.stageTemplateId)}
                            disabled={cancellingStageId === stage.stageTemplateId}
                          >
                            {cancellingStageId === stage.stageTemplateId ? '취소 중...' : '결제 요청 취소'}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    {stage.description ? (
                      <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{stage.description}</p>
                    ) : null}
                    <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">요청 금액</dt>
                        <dd className="text-base font-semibold text-slate-900">
                          {formatCurrency(stage.requestAmount)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">요청일</dt>
                        <dd>{formatDateTime(stage.requestedAt)}</dd>
                      </div>
                      {stage.paidAt ? (
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-500">결제 완료일</dt>
                          <dd>{formatDateTime(stage.paidAt)}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">상담 관리</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="sidebar-primary"
              onClick={openPaymentDialog}
              disabled={!requestableStages.length}
              className="w-full sm:w-auto sm:flex-1"
            >
              결제 요청하기
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/supercore/consultations')}
              className="w-full sm:w-auto sm:flex-1"
            >
              목록으로
            </Button>
          </div>
          {errorMessage ? <p className="mt-4 text-sm text-destructive">{errorMessage}</p> : null}
          {requestableStages.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              기존 결제 요청을 취소하거나 이전 단계 결제가 완료되어야 새 결제 요청을 만들 수 있습니다.
            </p>
          ) : null}
        </div>
      </div>

      <Transition
        show={toast !== null}
        as={Fragment}
        enter="transform ease-out duration-200 transition"
        enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enterTo="translate-y-0 opacity-100 sm:translate-x-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        afterLeave={() => setToast(null)}
      >
        <div className="fixed inset-x-0 top-4 flex justify-center px-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:top-auto sm:px-0">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                    toast?.type === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : toast?.type === 'info'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {toast?.type === 'success' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : toast?.type === 'info' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12" y2="8" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">{toast?.message}</p>
                </div>
                <button
                  type="button"
                  className="rounded p-1 text-slate-400 transition hover:text-slate-600"
                  onClick={() => setToast(null)}
                  aria-label="알림 닫기"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <Transition appear show={paymentDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setPaymentDialogOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    결제 요청 만들기
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-slate-600">
                    결제 단계를 선택하고 금액을 입력한 뒤 저장하세요.
                  </Dialog.Description>

                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700" htmlFor="stage-select">
                        결제 단계
                      </label>
                      <select
                        id="stage-select"
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-40"
                        value={selectedStageId ?? ''}
                        onChange={event => {
                          const nextId = event.target.value;
                          setSelectedStageId(nextId);
                          setRequestAmountInput('');
                        }}
                      >
                        {requestableStages.map(stage => (
                          <option key={stage.stageTemplateId} value={stage.stageTemplateId}>
                            {`단계 ${stage.stageOrder} · ${stage.title}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700" htmlFor="request-amount">
                        요청 금액 (원)
                      </label>
                      <Input
                        id="request-amount"
                        value={requestAmountInput}
                        onChange={event => {
                          const numericValue = event.target.value.replace(/[^0-9]/g, '');
                          if (numericValue) {
                            setRequestAmountInput(Number(numericValue).toLocaleString('ko-KR'));
                          } else {
                            setRequestAmountInput('');
                          }
                        }}
                        placeholder="예: 88,000"
                        inputMode="numeric"
                      />
                      {requestAmountInput && (
                        <p className="text-xs text-slate-500">
                          {requestAmountInput}원
                        </p>
                      )}
                    </div>

                    {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={paymentSubmitting}>
                      취소
                    </Button>
                    <Button variant="primary" onClick={handlePaymentRequestSubmit} disabled={paymentSubmitting}>
                      {paymentSubmitting ? '저장 중...' : '결제 요청 저장'}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </SupercoreLayout>
  );
}
