'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import SupercoreLayout from '@/components/supercore/SupercoreLayout';
import AdminLoadingScreen from '@/components/supercore/AdminLoadingScreen';
import Pagination from '@/components/supercore/Pagination';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import type { User } from '@/types/admin';
import { formatDateTimeShort as formatDateTime, formatDate } from '@/lib/admin/format';

interface SearchFilters {
  dateFrom: string;
  dateTo: string;
  name: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Get default dates (today and today-30days)
  const getDefaultDates = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    };
  };

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    ...getDefaultDates(),
    name: ''
  });

  const searchFiltersRef = useRef<SearchFilters>(searchFilters);

  useEffect(() => {
    searchFiltersRef.current = searchFilters;
  }, [searchFilters]);

  const itemsPerPage = 15;

  const loadUsers = useCallback(async (page = 1, filters?: SearchFilters) => {
    setIsLoadingUsers(true);
    try {
      const effectiveFilters = filters ?? searchFiltersRef.current;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      if (effectiveFilters.dateFrom) params.append('dateFrom', effectiveFilters.dateFrom);
      if (effectiveFilters.dateTo) params.append('dateTo', effectiveFilters.dateTo);
      if (effectiveFilters.name) params.append('name', effectiveFilters.name);

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalCount(data.total || 0);
        setCurrentPage(page);
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [itemsPerPage]);

  const handleAuthReady = useCallback(() => loadUsers(), [loadUsers]);
  const { isCheckingAuth } = useAdminAuth({ onReady: handleAuthReady });

  const handleSearch = () => {
    loadUsers(1, searchFilters);
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setSearchFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    const defaultDates = getDefaultDates();
    setSearchFilters({
      ...defaultDates,
      name: ''
    });
    loadUsers(1, {
      ...defaultDates,
      name: ''
    });
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (isCheckingAuth) {
    return <AdminLoadingScreen />;
  }

  return (
    <SupercoreLayout title="회원 관리">
      <div className="space-y-6">
        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">검색 필터</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom" className="text-xs">가입일 (시작)</Label>
              <DateInput
                id="dateFrom"
                value={searchFilters.dateFrom}
                onChange={(value) => handleFilterChange('dateFrom', value)}
                placeholder="YYYY-MM-DD"
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo" className="text-xs">가입일 (종료)</Label>
              <DateInput
                id="dateTo"
                value={searchFilters.dateTo}
                onChange={(value) => handleFilterChange('dateTo', value)}
                placeholder="YYYY-MM-DD"
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="이름 검색"
                value={searchFilters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="flex items-end gap-2 sm:col-span-2">
              <Button onClick={handleReset} variant="outline" className="h-10 px-8 flex-1 bg-white text-primary border-primary hover:bg-primary hover:text-white">
                초기화
              </Button>
              <Button onClick={handleSearch} variant="primary" className="h-10 px-8 flex-1">
                검색
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                회원 목록 <span className="text-sm text-slate-600 font-normal">({totalCount}명)</span>
              </h2>
            </div>
          </div>

          <div className="p-6">
            {isLoadingUsers ? (
              <div className="text-center py-12 text-slate-600">
                회원 목록을 불러오는 중...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                회원이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                        가입일시
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                        이름
                      </th>
                      <th className="hidden md:table-cell px-4 py-3 text-center text-sm font-semibold text-slate-900">
                        전화번호
                      </th>
                      <th className="hidden lg:table-cell px-4 py-3 text-center text-sm font-semibold text-slate-900">
                        마지막 로그인
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                        상담건수
                      </th>
                      <th className="hidden lg:table-cell px-4 py-3 text-center text-sm font-semibold text-slate-900">
                        결제건수
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-sm text-slate-600 text-center">
                          <span className="hidden sm:inline">{formatDateTime(user.created_at)}</span>
                          <span className="sm:hidden">{formatDate(user.created_at)}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 text-center">
                          {user.legal_name || '-'}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-slate-600 text-center">
                          {user.phone || '-'}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-slate-600 text-center">
                          {user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 text-center">
                          {user.consultation_count}건
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-slate-600 text-center">
                          {user.payment_count}건
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <Button
                            onClick={() => router.push(`/supercore/users/${user.id}`)}
                            size="sm"
                            variant="primary"
                            className="w-20"
                          >
                            보기
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!isLoadingUsers && totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onChange={loadUsers} />
            )}
          </div>
        </div>
      </div>
    </SupercoreLayout>
  );
}
