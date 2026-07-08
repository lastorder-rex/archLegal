import type { Metadata } from 'next';
import { SiteFooter } from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  title: '이용약관 | 양성화.com - 인건(仁建)',
  description: 'ArchLegal 서비스 이용약관',
};

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-foreground">
        <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">이용약관</h1>
          <p className="text-muted-foreground">
            이 문서는 ArchLegal(이하 “회사”)가 제공하는 서비스 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항 등 기본적인 사항을 규정합니다.
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <div>
            <p className="text-xs">시행일: 2025-01-01</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">제1조 (목적)</h2>
            <p>
              본 약관은 회사가 제공하는 양성화 관련 상담 및 기타 부가 서비스(이하 “서비스”)의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 정함을 목적으로 합니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제2조 (정의)</h2>
            <p>① “서비스”란 회사가 웹사이트를 통해 제공하는 상담 신청, 진행 현황 조회, 결제 및 관련 부가 기능 일체를 말합니다.</p>
            <p>② “이용자”란 본 약관에 동의하고 서비스를 이용하는 회원 및 비회원을 의미합니다.</p>
            <p>③ “회원”이란 제4조에 따라 가입을 완료한 자를 의미하며, “비회원”은 회원 가입 없이 서비스를 이용하는 자를 말합니다.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제3조 (약관의 효력 및 변경)</h2>
            <p>
              ① 회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면 또는 연결 화면에 게시합니다.
            </p>
            <p>
              ② 회사는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용일 및 개정 사유를 명시하여 적용일 7일 전부터 공지합니다.
            </p>
            <p>
              ③ 이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 회원 탈퇴를 요청할 수 있습니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제4조 (회원가입)</h2>
            <p>① 이용자는 카카오 계정 인증을 통해 로그인한 뒤 회사가 요청하는 필수 정보를 정확히 입력하여 회원가입을 완료할 수 있습니다.</p>
            <p>② 이용자는 회원가입 시 허위 정보를 제공해서는 안 되며, 정보 변경 시 지체 없이 수정해야 합니다.</p>
            <p>③ 회원가입 및 서비스 이용과정에서 회사는 개인정보 처리방침에 따라 최소한의 정보를 수집·이용합니다.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제5조 (회원가입 제한 등)</h2>
            <p>① 회사는 아래 각 호의 경우 회원가입을 제한할 수 있습니다.</p>
            <ul className="list-inside list-disc space-y-1">
              <li>회사가 허용하는 최대 계정 보유 개수를 초과하여 동일한 실명 정보로 가입하는 경우</li>
              <li>만 14세 미만인 자가 가입하는 경우</li>
              <li>서비스 운영정책 위반으로 조치를 받은 자가 조치 기간 중 임의 탈퇴 후 재가입하고자 하는 경우</li>
              <li>서비스 운영정책 위반으로 가입 제한 조치를 받은 자가 가입하고자 하는 경우</li>
            </ul>
            <p>② 회사는 관련 법령 및 본 약관에 위배되거나 사회적 질서, 미풍양속을 저해할 우려가 있는 경우 회원가입 및 서비스 이용을 제한할 수 있습니다.</p>
            <p>③ 회사는 아래 각 호의 경우 회원가입 또는 서비스 이용을 유보할 수 있으며, 이때 유보 사유 및 이용 가능 시기를 서비스 화면 또는 별도 수단으로 안내합니다.</p>
            <ul className="list-inside list-disc space-y-1">
              <li>서비스 제공 설비 용량에 여유가 없는 경우</li>
              <li>서비스 제공을 위한 기술적 문제가 있다고 판단되는 경우</li>
              <li>기타 회사가 재정적·기술적으로 필요하다고 인정하는 경우</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제6조 (개인정보 보호)</h2>
            <p>회사는 관련 법령과 개인정보 처리방침에 따라 이용자의 개인정보를 보호하며, 세부 내용은 서비스 내 “개인정보 처리방침”에서 확인할 수 있습니다.</p>
            <p>개인정보 처리방침: <a className="underline" href="/privacy-policy">/privacy-policy</a></p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제7조 (서비스의 제공 및 변경)</h2>
            <p>① 회사는 이용자에게 상담 접수, 진행현황 안내, 결제, 기타 부가 서비스를 제공합니다.</p>
            <p>② 회사는 운영상 또는 기술상 필요에 따라 서비스의 전부 또는 일부를 변경할 수 있으며, 변경 사항은 사전에 공지합니다.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제8조 (서비스 이용제한)</h2>
            <p>회사는 이용자가 본 약관 및 관계 법령을 위반한 경우 서비스 이용을 제한하거나 중지할 수 있습니다. 이에 대한 세부 기준은 내부 정책에 따릅니다.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제9조 (책임 제한)</h2>
            <p>① 회사는 천재지변, 불가항력, 이용자의 귀책사유 등으로 인한 서비스 장애에 대해 책임을 지지 않습니다.</p>
            <p>② 회사는 이용자 간 또는 이용자와 제3자 간 발생한 분쟁에 개입하지 않으며, 이에 대한 책임을 지지 않습니다.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제10조 (준거법 및 재판관할)</h2>
            <p>본 약관은 대한민국 법령에 따르며, 서비스 이용과 관련하여 회사와 이용자 간 분쟁이 발생한 경우 민사소송법상의 관할법원을 전속 관할로 합니다.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제11조 (결제 및 환불)</h2>
            <p>① 결제는 회사가 안내하는 결제수단(토스 등)을 통해 진행되며, 결제 단계 및 금액은 사전 고지합니다.</p>
            <p>
              ② 환불 및 취소 기준은 서비스 성격에 따라 상이할 수 있으며, 자세한 내용은 “환불정책”을 따릅니다.
              환불정책: <a className="underline" href="/refund-policy">/refund-policy</a>
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제12조 (약관 동의 및 고지)</h2>
            <p>① 이용자는 회원가입 또는 결제 진행 시 약관 동의 절차를 거치며, 동의 시 약관에 동의한 것으로 봅니다.</p>
            <p>② 회사는 약관 변경 시 적용일 및 변경 사유를 서비스 내 공지하고, 주요 변경 사항은 별도의 고지 수단을 통해 안내할 수 있습니다.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">문의</h2>
            <p>본 약관에 관한 문의는 서비스 내 문의 채널 또는 아래로 연락해 주세요.</p>
            <ul className="list-inside list-disc space-y-1">
              <li>이메일: support@archlegal.co.kr</li>
              <li>전화: 02-6348-1009 (운영 시간: 월~금 09:30~18:30)</li>
            </ul>
          </div>


        </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
