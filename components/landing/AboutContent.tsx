import { MessageCircleQuestionMark } from 'lucide-react';

type AboutFaq = {
  question: string;
  answer: string;
};

type AboutContentProps = {
  faqs: ReadonlyArray<AboutFaq>;
};

export function AboutContent({ faqs }: AboutContentProps) {
  return (
    <>
      <section className="space-y-3">
        <p className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          시장 현황
        </p>
        <h2 className="text-2xl font-bold text-foreground">
          전국 147,726동의 위반 건축물, 지금이 합법화의 골든타임입니다.
        </h2>
        <p className="text-base text-muted-foreground">
          국토교통부 2025 보고서에 따르면 위반 건축물은 최근 10년간 연평균 5~6천 동씩 증가했고,
          시정명령을 이행하는 경우는 40~50%에 그칩니다. 반복되는 이행강제금, 금융거래 제한,
          임차인 피해가 주요 문제로 지적되고 있습니다.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <MessageCircleQuestionMark className="h-6 w-6 text-primary" aria-hidden />
          자주 묻는 질문 전체 보기
        </h3>
        <div className="space-y-4 text-base text-muted-foreground">
          {faqs.map(faq => (
            <div key={faq.question} className="space-y-2">
              <p className="font-semibold text-card-foreground">{faq.question}</p>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">우리가 해결하는 핵심 이슈</h3>
          <ul className="mt-4 space-y-3 text-base text-muted-foreground">
            <li>• 『특정건축물 정리에 관한 특별조치법』이 2026년 6월 16일 제정·공포되어 2026년 12월 17일 시행됩니다.</li>
            <li>• 이 특별법에 포함되는 단독, 다세대, 다가구 주택의 양성화 가능성을 정확히 진단하고, 실패없는 양성화 솔류션을 제공합니다.</li>
      
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">이 서비스를 위한 고객</h3>
          <ul className="mt-4 space-y-3 text-base text-muted-foreground">
            <li>• 상가·공장 등 자산을 보유한 건물주와 운영자</li>
            <li>• 신규 개발 사업을 추진하는 시행사·건축사</li>
            <li>• 위반 건축물 관리와 보고 체계를 책임지는 지자체 담당자</li>
            <li>• 불법 건축물로 피해를 겪는 임차인과 매수 예정자</li>
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-primary/40 bg-primary/5 p-6 dark:border-primary/30 dark:bg-primary/10">
        <h3 className="text-lg font-semibold text-primary dark:text-primary-300">우리가 제공하는 전 과정 솔루션</h3>
        <ol className="mt-4 space-y-3 text-base text-primary/80 dark:text-primary-100">
          <li>
            1. <span className="font-semibold">사전 진단</span> – 현장조사를 통해 위반 유형을 분류하고 합법화 가능성을 평가합니다.
          </li>
          <li>
            2. <span className="font-semibold">서류·도면 패키지 준비</span> – 건축물대장, 구조 검토, 이행강제금 감경자료 등 필수 서류를
            원스톱으로 준비합니다.
          </li>
          <li>
            3. <span className="font-semibold">공공기관 협의</span> – 지자체 TF, 건축위원회 심의, 관계부서 협의를 대행하여 승인 리스크를
            관리합니다.
          </li>
          {/*
                <li>
                4. <span className="font-semibold">시공·복구 관리</span> – 특례 규정을 활용해 필요한 부분 보수·복구를 설계하고 시공 품질을
                관리합니다.
                </li>
                <li>
                5. <span className="font-semibold">사후 모니터링</span> – 재발 방지를 위한 정기 점검과 기준 변화 알림으로 안전한 자산 운용을
                지원합니다.
                </li>
          */}
        </ol>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground">왜 지금 시작해야 하나요?</h3>
        <ul className="mt-4 space-y-3 text-base text-muted-foreground">
          <li>
            • 특정건축물 정리에 관한 특별조치법은 2026.12.17 시행되어 18개월(~2028.6.16) 한시로 적용되므로, 기회를 놓치면 다시 합법화하기 어렵습니다.
          </li>
          <li>• 반복 부과 의무화된 이행강제금과 가중 부과 제도로 인해 방치할수록 비용이 증가합니다.</li>
          <li>• 공인중개사 건축물대장 제시 의무화, 매매·임대차 책임 강화로 시장 투명성이 높아지고 있습니다.</li>
        </ul>
      </section>
    </>
  );
}
