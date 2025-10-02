'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SupercoreLayout from '@/components/supercore/SupercoreLayout';

interface Admin {
  id: string;
  username: string;
}

interface User {
  id: string;
  email: string;
  phone: string;
  created_at: string;
  last_sign_in_at: string;
  consultation_count: number;
  payment_count: number;
}

interface SearchFilters {
  dateFrom: string;
  dateTo: string;
  email: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Get default dates (today and today-10days)
  const getDefaultDates = () => {
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);

    return {
      dateFrom: tenDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    };
  };

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    ...getDefaultDates(),
    email: ''
  });
  const itemsPerPage = 15;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/verify', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
        setIsAuthenticated(true);
        loadUsers();
      } else {
        router.push('/supercore');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/supercore');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async (page = 1, filters = searchFilters) => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.email) params.append('email', filters.email);

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
  };

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
      email: ''
    });
    loadUsers(1, {
      ...defaultDates,
      email: ''
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <SupercoreLayout title="회원 관리">
      <div className="space-y-6">
        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">검색 필터</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom" className="text-xs">가입일 (시작)</Label>
              <Input
                id="dateFrom"
                type="date"
                value={searchFilters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo" className="text-xs">가입일 (종료)</Label>
              <Input
                id="dateTo"
                type="date"
                value={searchFilters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="email" className="text-xs">이메일</Label>
              <Input
                id="email"
                type="text"
                placeholder="이메일 검색"
                value={searchFilters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        가입일시
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        이메일
                      </th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        전화번호
                      </th>
                      <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        마지막 로그인
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        상담건수
                      </th>
                      <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        결제건수
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
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
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDateTime(user.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {user.email}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-slate-600">
                          {user.phone || '-'}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-slate-600">
                          {user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {user.consultation_count}건
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-slate-600">
                          {user.payment_count}건
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            onClick={() => router.push(`/supercore/users/${user.id}/consultations`)}
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
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => loadUsers(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  이전
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant="primary"
                        size="sm"
                        onClick={() => loadUsers(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => loadUsers(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  다음
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SupercoreLayout>
  );
}
