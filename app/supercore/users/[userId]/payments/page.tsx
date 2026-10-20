'use client';

import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import SupercoreLayout from '@/components/supercore/SupercoreLayout';
import AdminLoadingScreen from '@/components/supercore/AdminLoadingScreen';
import Pagination from '@/components/supercore/Pagination';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { formatDateTimeShortNullable as formatDateTime, formatAmountWon as formatAmount } from '@/lib/admin/format';

interface StageTemplate {
  id: string;
  code: string;
  title: string;
  description: string | null;
  stage_order: number;
}

interface Consultation {
  id: string;
  name: string;
  phone: string;
  address: string;
  address_detail: string | null;
}

interface Payment {
  id: string;
  user_id: string;
  consultation_id: string | null;
  stage_template_id: string;
  status: string;
  request_amount: number | null;
  requested_at: string | null;
  requested_by: string | null;
  paid_amount: number | null;
  paid_at: string | null;
  payment_key: string | null;
  created_at: string;
  updated_at: string;
  stage_template: StageTemplate | null;
  consultation: Consultation | null;
}

export default function UserPaymentsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 15;

  const loadPayments = useCallback(async (page = 1) => {
    setIsLoadingPayments(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      const response = await fetch(`/api/admin/users/${userId}/payments?${params.toString()}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setTotalCount(data.total || 0);
        setCurrentPage(page);
      } else {
        console.error('Failed to load payments');
      }
    } catch (error) {
      console.error('Load payments error:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  }, [itemsPerPage, userId]);

  const handleAuthReady = useCallback(() => loadPayments(), [loadPayments]);
  const { isCheckingAuth } = useAdminAuth({ onReady: handleAuthReady });

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'locked': '잠금',
      'unlocked': '대기중',
      'requested': '요청됨',
      'paid': '완료',
      'cancelled': '취소'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'locked': 'text-slate-500',
      'unlocked': 'text-blue-600',
      'requested': 'text-yellow-600',
      'paid': 'text-green-600',
      'cancelled': 'text-red-600'
    };
    return colorMap[status] || 'text-slate-600';
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (isCheckingAuth) {
    return <AdminLoadingScreen />;
  }

  return (
    <SupercoreLayout title={`회원 결제 내역`}>
      <div className="space-y-6">
        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                결제 목록 <span className="text-sm text-slate-600 font-normal">({totalCount}건)</span>
              </h2>
            </div>
          </div>

          <div className="p-6">
            {isLoadingPayments ? (
              <div className="text-center py-12 text-slate-600">
                결제 내역을 불러오는 중...
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                결제 내역이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        요청일시
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        단계
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        상태
                      </th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        상담 정보
                      </th>
                      <th className="hidden lg:table-cell px-4 py-3 text-right text-sm font-semibold text-slate-900">
                        요청금액
                      </th>
                      <th className="hidden lg:table-cell px-4 py-3 text-right text-sm font-semibold text-slate-900">
                        결제금액
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => router.push(`/supercore/payments/${payment.id}`)}
                      >
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDateTime(payment.requested_at)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {payment.stage_template?.title || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-semibold ${getStatusColor(payment.status)}`}>
                            {getStatusLabel(payment.status)}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-slate-600">
                          {payment.consultation ? (
                            <div>
                              <div className="font-medium">{payment.consultation.name}</div>
                              <div className="text-xs text-slate-500">{payment.consultation.phone}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-slate-600 text-right">
                          {formatAmount(payment.request_amount)}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-right">
                          <span className={payment.paid_amount ? 'text-green-600 font-semibold' : 'text-slate-600'}>
                            {formatAmount(payment.paid_amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/supercore/payments/${payment.id}`);
                            }}
                            size="sm"
                            variant="primary"
                            className="w-20"
                          >
                            상세보기
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!isLoadingPayments && totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onChange={loadPayments} />
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-6"
            onClick={() => router.push(`/supercore/users/${userId}`)}
          >
            회원 상세로 돌아가기
          </Button>
        </div>
      </div>
    </SupercoreLayout>
  );
}
