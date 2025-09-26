import type { Metadata } from 'next';
import { SiteFooter } from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  title: '개인정보 처리방침 | ArchLegal',
  description: 'ArchLegal(archlegal.co.kr)의 개인정보 처리방침 안내문입니다.'
};

const effectiveDate = '2024년 9월 25일';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-24">
        <header className="space-y-4">
          <p className="text-sm font-medium text-primary">시행일: {effectiveDate}</p>
          <h1 className="text-3xl font-bold text-foreground">개인정보 처리방침</h1>
          <p className="text-sm text-muted-foreground">
            ArchLegal(이하 "회사")는 이용자의 개인정보를 소중히 여기며 안전하게 보호하기 위해 최선을 다하고 있습니다. 본 방침은
            회사가 제공하는 상담 서비스와 카카오 로그인 연동 과정에서 수집·이용되는 개인정보 처리 기준을 설명합니다.
          </p>
        </header>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. 총칙</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>회사명: www.archlegal.co.kr(이하 "회사")는 관련 개인정보 보호 법령과 감독기관 가이드라인을 준수합니다.</li>
              <li>회사는 본 방침을 홈페이지 하단 및 상담 게시판 화면에 상시 공개하며, 개정 시 시행 7일 전부터 공지합니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. 수집하는 개인정보 항목 및 방법</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                필수 항목: 카카오 계정 고유번호(kakao_id), 카카오 프로필 닉네임, 상담 게시판 닉네임, 문의 내용, 문의 일시, 서비스 이용 기록,
                접속 로그, 접속 IP
              </li>
              <li>선택 항목: 카카오 계정 이메일, 전화번호, 출생 연도, 성별(각 범위 동의 시), 추가 첨부 파일</li>
              <li>수집 방법: 카카오 로그인 연동을 통한 자동 수집, 상담 게시판 작성 시 이용자 입력, 고객센터 상담 및 서비스 이용 과정에서 자동 생성</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. 개인정보의 이용 목적</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>본인 확인 및 회원 식별, 상담 게시판 작성 시 사용자 표시</li>
              <li>상담 처리 및 고객 응대 이력 관리</li>
              <li>서비스 개선, 보안 강화, 부정 이용 방지, 법령 준수</li>
              <li>선택 항목 활용에 동의한 경우 맞춤형 상담 및 공지 발송</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. 개인정보의 보유 및 이용 기간</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>상담 기록: 상담 종료 후 3년간 보관하며, 관련 법령 또는 회사 정책에 따라 단축·연장할 수 있습니다.</li>
              <li>서비스 이용 기록: 관계 법령에 따라 표시·광고 6개월, 계약·청약철회 5년, 대금결제 및 재화 공급 5년 등으로 보관합니다.</li>
              <li>법령상 의무 보관 기간 경과 후에는 지체 없이 파기합니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. 개인정보의 제3자 제공</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>회사는 이용자의 사전 동의 없이 개인정보를 제3자에게 제공하지 않습니다.</li>
              <li>다만 법령에 근거하거나 수사기관의 적법한 요청이 있는 경우에는 예외적으로 제공할 수 있습니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. 개인정보 처리의 위탁</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>회사는 서비스 운영을 위해 시스템 인프라 운영, 고객 상담, 데이터 백업 등 업무를 외부 전문 업체에 위탁할 수 있습니다.</li>
              <li>위탁 시 개인정보 보호 관련 법령을 준수하며, 수탁업체명·위탁업무·보유 기간을 홈페이지에 고지합니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. 개인정보 이용자 및 법정대리인의 권리</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>이용자는 개인정보 열람·정정·삭제·처리정지를 언제든지 요청할 수 있으며, 회사는 지체 없이 조치합니다.</li>
              <li>개인정보 삭제 시 서비스 제공이 제한될 수 있으며, 관련 법령에 따른 보관 의무는 예외로 합니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. 개인정보의 파기 절차 및 방법</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>이용 목적을 달성한 후에는 지체 없이 파기하며, 전자적 파일은 복구 불가능하도록 삭제하고 종이 문서는 분쇄 또는 소각합니다.</li>
              <li>별도 DB에 분리 저장된 정보는 보유 기간 종료 시 자동 또는 수동으로 파기합니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">9. 개인정보의 안전성 확보 조치</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>관리적 조치: 내부 관리 계획 수립, 임직원 교육, 최소 권한 부여</li>
              <li>기술적 조치: 접근 통제, 암호화, 보안 프로그램 설치·갱신, 로그 모니터링</li>
              <li>물리적 조치: 전산실·자료 보관실 접근 통제, 보안 시스템 운영</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">10. 카카오 로그인 연동 안내</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>카카오 로그인은 카카오톡 또는 카카오 계정을 통한 인증 서비스입니다.</li>
              <li>
                이용자는 
                <a
                  href="https://accounts.kakao.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-4"
                >
                  https://accounts.kakao.com
                </a>
                에서 제3자 정보 제공 내역을 확인하고 연결을 해제할 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">11. 개인정보 보호책임자</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>개인정보 보호책임자: 이형훈 본부장</li>
              <li>연락처: 010-6353-1058, interworldarch@nate.com</li>
              <li>이용자는 문의 및 신고 시 지체 없이 답변·처리를 받을 수 있습니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">12. 권익침해 구제 방법</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>개인정보 침해 신고·상담: 개인정보침해신고센터(118), 개인정보분쟁조정위원회(1833-6972), 대검찰청 사이버수사과(1301), 경찰청(182)</li>
              <li>회사의 처리에 만족하지 못한 경우 위 기관을 통해 도움을 받으실 수 있습니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">13. 고지의 의무</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>본 방침은 2024년 9월 25일부터 적용됩니다.</li>
              <li>내용 추가, 삭제, 수정이 있을 경우 시행 7일 전부터 홈페이지 또는 알림톡을 통해 공지합니다.</li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
