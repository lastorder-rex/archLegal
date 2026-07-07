'use client';

import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import SupercoreLayout from '@/components/supercore/SupercoreLayout';
import AdminLoadingScreen from '@/components/supercore/AdminLoadingScreen';
import Pagination from '@/components/supercore/Pagination';
import ConsultationTable from '@/components/supercore/ConsultationTable';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import type { Consultation } from '@/types/admin';

export default function UserConsultationsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userEmail, setUserEmail] = useState('');

  const itemsPerPage = 15;

  const loadConsultations = useCallback(async (page = 1) => {
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
  }, [itemsPerPage, userId]);

  const handleAuthReady = useCallback(() => loadConsultations(), [loadConsultations]);
  const { isCheckingAuth } = useAdminAuth({ onReady: handleAuthReady });

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (isCheckingAuth) {
    return <AdminLoadingScreen />;
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
              <ConsultationTable
                consultations={consultations}
                onSelect={(id) => router.push(`/supercore/consultations/${id}`)}
                align="left"
              />
            )}

            {/* Pagination */}
            {!isLoadingConsultations && totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onChange={loadConsultations} />
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
