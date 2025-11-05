'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SupercoreLayout from '@/components/supercore/SupercoreLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Folder } from 'lucide-react';

interface Admin {
  id: string;
  username: string;
}

interface PaymentRow {
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
  consultation: {
    id: string;
    name: string | null;
    phone: string | null;
    address: string | null;
    address_detail: string | null;
  } | null;
  driveFolder: {
    driveFolderId: string | null;
    driveFolderName: string | null;
    status: string | null;
  } | null;
}

interface SearchFilters {
  requestedFrom: string;
  requestedTo: string;
  name: string;
  phone: string;
  address: string;
  status: string;
}

interface PaymentsResponse {
  payments: PaymentRow[];
  page: number;
  limit: number;
  total: number;
}

const statusOptions = [
  { value: 'all', label: '전체' },
  { value: 'awaiting', label: '결제 대기' },
  { value: 'paid', label: '결제 완료' }
];

const statusLabelMap: Record<string, string> = {
  awaiting: '결제 대기',
  requested: '요청됨',
  paid: '결제 완료',
  locked: '잠금'
};

const statusClassMap: Record<string, string> = {
  awaiting: 'bg-amber-100 text-amber-800 border-amber-200',
  requested: 'bg-blue-100 text-blue-800 border-blue-200',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  locked: 'bg-slate-100 text-slate-700 border-slate-200'
};

function formatDateTime(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatAmount(value: number | null) {
  if (value === null || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('ko-KR').format(value);
}

function getDefaultDateRange() {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  return {
    requestedFrom: sevenDaysAgo.toISOString().split('T')[0],
    requestedTo: today.toISOString().split('T')[0]
  };
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admin, setAdmin] = useState<Admin | null>(null);

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  const defaultDates = getDefaultDateRange();
  const [filters, setFilters] = useState<SearchFilters>({
    requestedFrom: defaultDates.requestedFrom,
    requestedTo: defaultDates.requestedTo,
    name: '',
    phone: '',
    address: '',
    status: 'all'
  });

  const filtersRef = useRef<SearchFilters>(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const itemsPerPage = 15;

  const loadPayments = useCallback(async (
    page = 1,
    nextFilters?: SearchFilters
  ) => {
    const appliedFilters = nextFilters ?? filtersRef.current;
    setIsLoadingPayments(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });

      if (appliedFilters.requestedFrom) params.append('requestedFrom', appliedFilters.requestedFrom);
      if (appliedFilters.requestedTo) params.append('requestedTo', appliedFilters.requestedTo);
      if (appliedFilters.name) params.append('name', appliedFilters.name);
      if (appliedFilters.phone) params.append('phone', appliedFilters.phone);
      if (appliedFilters.address) params.append('address', appliedFilters.address);
      if (appliedFilters.status && appliedFilters.status !== 'all') {
        params.append('status', appliedFilters.status);
      }

      const response = await fetch(`/api/admin/payments?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || '결제 목록을 불러오지 못했습니다.');
        return;
      }

      const data: PaymentsResponse = await response.json();
      setPayments(data.payments || []);
      setTotal(data.total || 0);
      setCurrentPage(data.page || 1);
    } catch (error) {
      console.error('결제 목록 조회 오류', error);
      alert('결제 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingPayments(false);
    }
  }, [itemsPerPage]);

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
      await loadPayments(1);
    } catch (error) {
      console.error('관리자 인증 오류', error);
      router.push('/supercore');
    } finally {
      setIsLoading(false);
    }
  }, [loadPayments, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    loadPayments(1, filters);
  };

  const handleReset = () => {
    const resetDates = getDefaultDateRange();
    const resetFilters: SearchFilters = {
      requestedFrom: resetDates.requestedFrom,
      requestedTo: resetDates.requestedTo,
      name: '',
      phone: '',
      address: '',
      status: 'all'
    };
    setFilters(resetFilters);
    loadPayments(1, resetFilters);
  };

  const handlePageChange = (page: number) => {
    loadPayments(page);
  };

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

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
    <SupercoreLayout title="결제 관리" onLogout={() => router.push('/supercore')}>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">검색 필터</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requestedFrom">요청일 (시작)</Label>
              <DateInput
                id="requestedFrom"
                value={filters.requestedFrom}
                onChange={(value) => handleFilterChange('requestedFrom', value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestedTo">요청일 (종료)</Label>
              <DateInput
                id="requestedTo"
                value={filters.requestedTo}
                onChange={(value) => handleFilterChange('requestedTo', value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">상태</Label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">고객명</Label>
              <Input
                id="name"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                placeholder="이름 검색"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">연락처</Label>
              <Input
                id="phone"
                value={filters.phone}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
                placeholder="휴대폰 번호 일부"
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                value={filters.address}
                onChange={(e) => handleFilterChange('address', e.target.value)}
                placeholder="도로명 또는 지번"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={handleSearch} disabled={isLoadingPayments}>
              검색
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} disabled={isLoadingPayments}>
              초기화
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">결제 요청 목록</h2>
              <p className="text-sm text-slate-500">총 {total.toLocaleString()}건</p>
            </div>
            <div>
              <Button variant="outline" onClick={() => loadPayments(currentPage)} disabled={isLoadingPayments}>
                새로고침
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">고객</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">요청 금액</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">상태</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 hidden md:table-cell">요청일</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 hidden md:table-cell">결제일</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 hidden md:table-cell">문서함</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingPayments ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      결제 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      검색 조건에 해당하는 결제 요청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => {
                    const customerName = payment.consultation?.name ?? '미확인';
                    const customerPhone = payment.consultation?.phone ?? '-';
                    const address = payment.consultation?.address ?? '-';
                    const statusLabel = statusLabelMap[payment.status] ?? payment.status;
                    const statusClass = statusClassMap[payment.status] ?? 'bg-slate-100 text-slate-700 border-slate-200';
                    const driveFolderId = payment.driveFolder?.driveFolderId ?? null;
                    return (
                      <tr key={payment.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{customerName}</div>
                          <div className="text-xs text-slate-500">{customerPhone}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[200px]">{address}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-900">₩ {formatAmount(payment.requestAmount)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-700 hidden md:table-cell">
                          {formatDateTime(payment.requestedAt)}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-700 hidden md:table-cell">
                          {formatDateTime(payment.paidAt)}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-700 hidden md:table-cell">
                          {driveFolderId ? (
                            <a
                              href={`https://drive.google.com/drive/folders/${driveFolderId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-primary hover:text-primary/80"
                            >
                              <Folder className="h-5 w-5" />
                              <span className="sr-only">문서함 열기</span>
                            </a>
                          ) : (
                            <span className="inline-flex items-center text-slate-400">
                              <Folder className="h-5 w-5" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="outline" onClick={() => router.push(`/supercore/payments/${payment.id}`)}>
                            상세
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 text-sm text-slate-600">
            <div>
              페이지 {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoadingPayments}
              >
                이전
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || isLoadingPayments}
              >
                다음
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SupercoreLayout>
  );
}
