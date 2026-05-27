import type { Metadata } from 'next';
import { SiteFooter } from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  title: '환불 · 취소 정책 | 인건(仁建) - 양성화 전문 플랫폼 | 양성화.com',
  description: 'ArchLegal(archlegal.co.kr)의 환불 및 취소 정책 안내문입니다.'
};

const lastUpdated = '2025년 10월 13일';

export default function RefundPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-24">
        <header className="space-y-4">
          <p className="text-sm font-medium text-primary">마지막 업데이트: {lastUpdated}</p>
          <h1 className="text-3xl font-bold text-foreground">환불 · 취소 정책</h1>
          <p className="text-sm text-muted-foreground">
            ArchLegal(이하 &#39;회사&#39;)는 상담 중심의 행정 대행 서비스를 제공하며, 결제와 환불은 상담 및 견적 절차를 완료한 고객을
            대상으로 이루어집니다. 본 정책은 회사가 제공하는 모든 유료 서비스에 적용됩니다.
          </p>
          <p className="text-xs text-muted-foreground">
            적용 대상: 양성화전문 플랫폼(ArchLegal)에서 제공하는 모든 유료 서비스(견적 기반 행정 대행 서비스 포함)
          </p>
        </header>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. 개요</h2>
            <p>
              회사는 전형적인 상품 판매형 쇼핑몰이 아니라 상담 요청, 현장 검토, 견적 산정, 결제로 이어지는 서비스형 결제 구조를 가지고
              있습니다. 본 환불 및 취소 정책은 고객이 결제한 행정 대행료, 실측 비용, 조사 비용 등에 적용됩니다.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. 환불 원칙</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>고객은 결제 전에 마이페이지 또는 담당자가 발송한 결제 요청서의 서비스 내용과 금액을 반드시 확인해야 합니다.</li>
              <li>회사의 귀책 사유가 없고 서비스가 아직 착수되지 않은 경우에는 결제 환불이 가능합니다.</li>
              <li>서비스가 착수되었거나 현장 방문 및 실측이 완료된 경우에는 이미 수행된 업무 비용을 공제한 후 환불합니다.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. 환불 가능 및 불가 기준</h2>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">A. 결제 취소(전액 환불) - 가능</h3>
              <ul className="list-disc space-y-1 pl-5">
                <li>관리자가 결제 요청을 보냈으나 고객이 결제를 진행하지 않은 상태에서 요청이 취소된 경우</li>
                <li>고객이 결제 후 24시간 이내에 환불을 요청하고 회사가 서비스를 아직 착수하지 않은 경우</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">B. 부분 환불 - 가능</h3>
              <ul className="list-disc space-y-1 pl-5">
                <li>서비스 착수 전 결제한 경우: 전액 환불 또는 합의된 행정 수수료 공제 후 환불</li>
                <li>서비스 착수 후 일부 업무가 수행된 경우: 실측비, 인건비 등 실제 수행된 업무 비용 및 행정부담 수수료를 공제 후 환불</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">C. 환불 불가 - 예시</h3>
              <ul className="list-disc space-y-1 pl-5">
                <li>고객 요청으로 이미 완료된 행정 대행 업무에 대해서는 환불이 불가할 수 있습니다.</li>
                <li>결제 후 고객의 연락 두절, 허위 정보 제공 등으로 인해 서비스 제공이 불가능해진 경우(회사의 귀책이 없는 경우)</li>
              </ul>
            </div>
          </section>
          
          {/*
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. 단건 결제 최고 금액</h2>
            <p>
              본 서비스의 단건 결제 기준 최고 한도는 5,000,000원(KRW 5,000,000)입니다. 특수한 사례나 대규모 공사 등은 별도 계약과 협의를 통해
              달라질 수 있으며, 이 경우 별도 약정서를 통해 처리합니다.
            </p>
          </section>
          */}
         
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. 환불 요청 방법</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                환불 요청 접수: 이메일 support@archlegal.co.kr 또는 마이페이지 결제 내역에서 환불 요청 기능을 통해 접수합니다.
              </li>
              <li>
                필요 정보: 주문 또는 결제 번호, 결제자 성명, 연락처, 환불 사유, 환불 받을 계좌(은행, 계좌번호, 예금주)를 제공해야 합니다.
              </li>
              <li>
                처리 기간: 접수 후 내부 확인까지 영업일 기준 3~7일이 소요되며, 결제 수단에 따라 외부 결제사 환불 반영까지 추가 5~14영업일이
                필요할 수 있습니다.
              </li>
              <li>
                환불 방법: 결제 취소 또는 계좌 이체 방식으로 진행하며, 결제 수단과 상황에 따라 환불 방식이 달라질 수 있습니다.
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. 수수료 및 환불액 산정</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>회사의 귀책 사유로 환불하는 경우 결제 수수료 및 제반 수수료는 회사가 부담하며 전액 환불합니다.</li>
              <li>
                고객 귀책 사유(단순 변심, 일정 변경 등)로 환불하는 경우 이미 수행된 업무 비용과 결제 수단 수수료(결제사 정책에 따름)를
                공제한 금액을 환불합니다.
              </li>
              <li>환불액 산정은 투명하게 계산하며, 환불 통지 시 상세 내역을 함께 제공합니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. 취소 및 환불 예외 사항</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>고객이 제공한 정보 오류로 추가 비용이 발생하거나 행정 처리가 지연된 경우 해당 비용이 환불액에서 차감될 수 있습니다.</li>
              <li>외부 기관(관청)에 서류 제출 및 수수료 납부가 완료된 경우 환불이 불가하며, 관청 환불이 가능한 경우 회수 후 정산합니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. 분쟁 및 이의 제기</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>환불 결정에 이의가 있는 경우 이메일 support@archlegal.co.kr로 이의 제기를 요청할 수 있습니다.</li>
              <li>협의로 해결되지 않는 경우 관련 소비자 보호 기관 또는 결제 대행사의 분쟁 조정 절차를 안내합니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. 개인정보 및 환불 처리 보안</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>환불 처리를 위해 수집한 개인정보는 환불 목적 외에는 사용하지 않으며 관련 법률에 따라 안전하게 처리하고 파기합니다.</li>
              <li>부정 사용 또는 사기 의심이 있는 경우 신분증 확인 등 추가 확인 절차를 진행할 수 있습니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">9. 결제 및 환불 문의</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>이메일: support@archlegal.co.kr</li>
              <li>전화: 02-6348-1009 (운영 시간: 월~금 09:30~18:30)</li>
              <li>마이페이지 1:1 문의를 통해서도 접수할 수 있습니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">11. 기타</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>본 정책은 관계 법령 및 결제 대행사 정책에 따라 변경될 수 있으며, 변경 시 홈페이지 공지와 함께 적용 일자를 명시합니다.</li>
              <li>환불 관련 세부 운영 절차는 내부 운영 매뉴얼을 따릅니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">자주 묻는 질문(FAQ)</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-foreground">Q. 결제 후 바로 환불 가능한가요?</p>
                <p>
                  A. 서비스 착수 여부에 따라 다르며, 착수 전이면 전액 환불이 가능하고 착수 후에는 이미 수행된 업무 비용을 공제합니다.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Q. 환불은 얼마나 걸리나요?</p>
                <p>
                  A. 내부 확인에 영업일 기준 3~7일이 소요되며, 카드사나 은행 등 외부 결제사의 환불 반영까지 추가 5~14영업일이 필요할
                  수 있습니다.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Q. 토스페이먼츠 심사 시 추가로 필요한 내용이 있나요?</p>
                <p>
                  A. 필요 시 상담 요청부터 마이페이지 결제까지의 화면과 관리자 결제 요청 예시를 제공할 수 있습니다.
                </p>
              </div>
            </div>
          </section>

         
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
