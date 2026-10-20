import Link from 'next/link';
import ConsultationForm from '@/components/consultation/ConsultationForm';
import { Button } from '@/components/ui/button';
import { requireUserSession, requireCompletedProfile } from '@/lib/auth/require-session';

export const revalidate = 0;

export default async function RequestPage() {
  const { supabase, session } = await requireUserSession('/request', { checkAuthError: true });

  const profile = await requireCompletedProfile(supabase, session, {
    nextTo: '/request',
    logError: true
  });

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold">상담 문의 등록</h1>
              <p className="text-muted-foreground mt-1">
                건축 관련 상담을 위해 필요한 정보를 입력해주세요
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Link href="/request/history" className="sm:w-auto">
                <Button variant="outline" className="sm:w-auto">
                  나의 상담 내역 보기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* User Info */}
          <div className="mb-6 bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {session.user.user_metadata?.name?.[0] ||
                   session.user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium">
                  {session.user.user_metadata?.name ||
                   session.user.user_metadata?.full_name ||
                   '사용자'}님 안녕하세요!
                </p>
                <p className="text-sm text-muted-foreground">
                  카카오 로그인 상태: 인증됨
                </p>
              </div>
            </div>
          </div>

          {/* Instructions - Collapsible */}
          <div className="mb-6 space-y-3">
            {/* 상담 신청 절차 */}
            <details className="bg-muted/50 rounded-lg overflow-hidden">
              <summary className="cursor-pointer p-4 font-semibold hover:bg-muted/70 transition-colors">
                📋 상담 신청 절차 (클릭하여 보기)
              </summary>
              <div className="px-4 pb-4">
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. 개인정보 입력 (실명, 연락처)</li>
                  <li>2. 주소 검색 및 선택</li>
                  <li>3. 건축물대장 정보 자동 조회</li>
                  <li>4. 상담 내용 작성 및 제출</li>
                </ol>
              </div>
            </details>

            {/* 이용 안내 */}
            <details className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
              <summary className="cursor-pointer p-4 font-semibold text-blue-900 hover:bg-blue-100 transition-colors">
                💡 이용 안내 (클릭하여 보기)
              </summary>
              <div className="px-4 pb-4">
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 주소는 도로명주소 기준으로 검색됩니다</li>
                  <li>• 건축물 정보는 국토교통부 공식 데이터를 사용합니다</li>
                  <li>• 상담 접수 후 전문가가 검토하여 연락드립니다</li>
                  <li>• 개인정보는 상담 목적으로만 사용됩니다</li>
                </ul>
              </div>
            </details>
          </div>

          {/* Consultation Form */}
          <div className="bg-card border border-border rounded-lg p-6">
            <ConsultationForm user={session.user} profile={profile} />
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold mb-2">❓ 문의사항이 있으신가요?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                상담 신청 과정에서 도움이 필요하시면 언제든 연락해주세요
              </p>
              <div className="space-y-1 text-sm">
                <p><strong>고객센터:</strong> 1588-0000</p>
                <p><strong>운영시간:</strong> 평일 09:00 - 18:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
