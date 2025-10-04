'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import SupercoreLayout from '@/components/supercore/SupercoreLayout';

interface Admin {
  id: string;
  username: string;
}

interface Consultation {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  address_detail: string | null;
  main_purps: string;
  message: string | null;
  created_at: string;
  attachments: any[];
}

export default function UserConsultationsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userEmail, setUserEmail] = useState('');

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
        loadConsultations();
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

  const loadConsultations = async (page = 1) => {
    setIsLoadingConsultations(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      const response = await fetch(`/api/admin/users/${userId}/consultations?${params.toString()}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setConsultations(data.consultations || []);
        setTotalCount(data.total || 0);
        setCurrentPage(page);

        // Get user email from first consultation if available
        if (data.consultations && data.consultations.length > 0 && data.consultations[0].email) {
          setUserEmail(data.consultations[0].email);
        }
      } else {
        console.error('Failed to load consultations');
      }
    } catch (error) {
      console.error('Load consultations error:', error);
    } finally {
      setIsLoadingConsultations(false);
    }
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
    <SupercoreLayout title={`회원 상담 내역${userEmail ? ` (${userEmail})` : ''}`}>
      <div className="space-y-6">
        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                상담 요청 목록 <span className="text-sm text-slate-600 font-normal">({totalCount}건)</span>
              </h2>
            </div>
          </div>

          <div className="p-6">
            {isLoadingConsultations ? (
              <div className="text-center py-12 text-slate-600">
                상담 내역을 불러오는 중...
              </div>
            ) : consultations.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                상담 요청이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        접수일시
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        이름
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        연락처
                      </th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        주소
                      </th>
                      <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        첨부파일
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {consultations.map((consultation) => (
                      <tr
                        key={consultation.id}
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => router.push(`/supercore/consultations/${consultation.id}`)}
                      >
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDateTime(consultation.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {consultation.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {consultation.phone}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-slate-600">
                          <div className="max-w-xs truncate" title={consultation.address}>
                            {consultation.address}
                          </div>
                          {consultation.address_detail && (
                            <div className="text-xs text-slate-500">
                              {consultation.address_detail}
                            </div>
                          )}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-slate-600">
                          {consultation.attachments?.length || 0}개
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/supercore/consultations/${consultation.id}`);
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
            {!isLoadingConsultations && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => loadConsultations(currentPage - 1)}
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
                        onClick={() => loadConsultations(pageNum)}
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
                  onClick={() => loadConsultations(currentPage + 1)}
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
