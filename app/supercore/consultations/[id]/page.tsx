'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getFileUrl } from '@/lib/utils/file-upload';

interface Admin {
  id: string;
  username: string;
}

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

export default function ConsultationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const consultationId = params.id as string;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoadingConsultation, setIsLoadingConsultation] = useState(false);

  // Download attachment file
  const downloadAttachment = async (attachment: { name: string; size: number; type: string; storagePath: string }) => {
    try {
      const result = await getFileUrl(attachment.storagePath);
      if (result.url) {
        // Fetch file as blob to force download instead of opening in browser
        const response = await fetch(result.url);
        if (!response.ok) {
          throw new Error('파일 다운로드에 실패했습니다.');
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = attachment.name;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
      } else {
        alert(`다운로드 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleOpenRoadview = (provider: 'kakao' | 'naver') => {
    if (!consultation) return;

    const encodedAddress = encodeURIComponent(consultation.address);

    const url = provider === 'kakao'
      ? `https://map.kakao.com/?map_type=TYPE_ROADVIEW&q=${encodedAddress}`
      : `https://map.naver.com/v5/search/${encodedAddress}?searchCoord=0,0,15,0,0,0`;

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

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
        loadConsultation();
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

  const loadConsultation = async () => {
    setIsLoadingConsultation(true);
    try {
      const response = await fetch(`/api/admin/consultations/${consultationId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setConsultation(data.consultation);
      } else {
        console.error('Failed to load consultation');
        alert('상담 내역을 불러올 수 없습니다.');
        router.push('/supercore/consultations');
      }
    } catch (error) {
      console.error('Load consultation error:', error);
      alert('상담 내역을 불러오는 중 오류가 발생했습니다.');
      router.push('/supercore/consultations');
    } finally {
      setIsLoadingConsultation(false);
    }
  };


  if (isLoading || isLoadingConsultation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-lg">상담 내역을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <h1 className="text-xl font-bold text-slate-900 flex-[6] md:flex-[8]">상담 상세</h1>
          <div className="flex-[4] md:flex-[2] flex justify-end">
            <Button variant="ghost" onClick={() => router.push('/supercore/consultations')} className="h-8 px-2 text-sm min-w-0 whitespace-nowrap">
              ← 목록으로
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
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
                <p className="text-sm text-slate-600 mb-1">주소</p>
                <p className="text-base font-medium text-slate-900">
                  {consultation.address}
                  {consultation.address_detail && ` ${consultation.address_detail}`}
                </p>
              </div>

              {/* 로드뷰 버튼 */}
              <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">로드뷰 확인</h4>
                  <p className="text-xs text-muted-foreground">
                    지도에서 로드뷰를 열어 주변 현황을 확인할 수 있습니다.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRoadview('kakao')}
                  >
                    카카오 로드뷰 열기
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRoadview('naver')}
                  >
                    네이버 로드뷰 열기
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 건축물 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">건축물 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">주요 용도</p>
                <p className="text-base font-medium text-slate-900">{consultation.main_purps}</p>
              </div>
              {consultation.tot_area && (
                <div>
                  <p className="text-sm text-slate-600">연면적</p>
                  <p className="text-base font-medium text-slate-900">{consultation.tot_area.toFixed(2)}㎡</p>
                </div>
              )}
              {consultation.plat_area && (
                <div>
                  <p className="text-sm text-slate-600">대지면적</p>
                  <p className="text-base font-medium text-slate-900">{consultation.plat_area.toFixed(2)}㎡</p>
                </div>
              )}
              {consultation.ground_floor_cnt && (
                <div>
                  <p className="text-sm text-slate-600">지상 층수</p>
                  <p className="text-base font-medium text-slate-900">{consultation.ground_floor_cnt}층</p>
                </div>
              )}
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
                      <p className="text-xs text-slate-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
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

          {/* 액션 버튼 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">상담 관리</h2>
            <div className="flex gap-3">
              <Button
                variant="sidebar-primary"
                onClick={() => {
                  // TODO: 결제 요청 생성 기능
                  alert('결제 요청 기능은 곧 구현될 예정입니다.');
                }}
              >
                결제 요청하기
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/supercore/consultations')}
              >
                목록으로
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
