export const metadata = {
  title: '이용약관 - ArchLegal',
  description: 'ArchLegal 서비스 이용약관'
};

export default function TermsOfServicePage() {
  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">이용약관</h1>
          <p className="text-muted-foreground">
            본 약관은 ArchLegal 서비스 이용에 필요한 기본 사항을 안내합니다. 
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-lg font-semibold text-foreground">제1조 (목적)</h2>
            <p>
              이 약관은 ArchLegal(이하 &ldquo;회사&rdquo;)가 제공하는 양성화 관련 상담 및 기타 서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 이용자의 권리, 의무, 책임사항 등을 규정함을 목적으로 합니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제2조 (정의)</h2>
            <p>
              ① &ldquo;서비스&rdquo;란 회사가 웹사이트를 통해 제공하는 상담 신청, 진행 현황 조회 등 일체의 서비스를 말합니다.
            </p>
            <p>② &ldquo;이용자&rdquo;란 본 약관에 동의하고 서비스를 이용하는 모든 회원 및 비회원을 의미합니다.</p>
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
            <p>
              ① 이용자는 카카오 계정을 통해 로그인 후 회사가 요청하는 필수 정보를 정확히 입력하여 회원가입을 완료할 수 있습니다.
            </p>
            <p>② 이용자는 회원가입 시 허위 정보를 제공해서는 안 되며, 정보 변경 시 즉시 수정해야 합니다.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제5조 (개인정보 보호)</h2>
            <p>
              회사는 관련 법령과 개인정보 처리방침에 따라 이용자의 개인정보를 보호하며, 개인정보 처리방침은 서비스 내 별도 페이지에서 확인할 수 있습니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제6조 (서비스의 제공 및 변경)</h2>
            <p>
              ① 회사는 이용자에게 상담 접수, 진행현황 안내, 기타 부가 서비스를 제공합니다.
            </p>
            <p>
              ② 회사는 서비스의 운영상 또는 기술상 필요에 따라 서비스의 전부 또는 일부를 변경할 수 있으며, 변경 사항은 사전에 공지합니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제7조 (서비스 이용제한)</h2>
            <p>
              회사는 이용자가 본 약관을 위반하거나 법령을 위반한 경우 서비스 이용을 제한하거나 중지할 수 있습니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제8조 (책임 제한)</h2>
            <p>
              ① 회사는 천재지변, 불가항력, 이용자의 귀책사유 등으로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.
            </p>
            <p>② 회사는 이용자 간 또는 이용자와 제3자 간 발생한 분쟁에 개입하지 않으며, 이에 대한 책임을 지지 않습니다.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">제9조 (준거법 및 재판관할)</h2>
            <p>
              본 약관은 대한민국 법령에 따르며, 서비스 이용과 관련하여 회사와 이용자 간에 발생한 분쟁에 대해 소송이 제기되는 경우 민사소송법상의 관할법원에 따릅니다.
            </p>
          </div>

          
        </section>
      </div>
    </main>
  );
}
