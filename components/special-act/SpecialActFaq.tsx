'use client';

import { useState } from 'react';
import type { SpecialActFaq as FaqItem } from '@/lib/constants/special-act';

// /special-act 전용 헤어라인 아코디언. 공용 FAQAccordion(다른 페이지 사용)에
// 영향 주지 않도록 별도 컴포넌트로 둔다. 콘텐츠(질문·답변)는 그대로 사용한다.

export function SpecialActFaq({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="border-t border-border">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question} className="border-b border-border">
            <button
              type="button"
              onClick={() => setOpenIndex(cur => (cur === index ? null : index))}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
              aria-expanded={isOpen}
              aria-controls={`sa-faq-panel-${index}`}
            >
              <span className="text-[1.05rem] font-semibold leading-snug text-foreground">
                {item.question}
              </span>
              <span
                data-open={isOpen}
                className="shrink-0 text-xl text-muted-foreground transition data-[open=true]:rotate-45 data-[open=true]:text-[color:var(--sa-accent)]"
                aria-hidden
              >
                +
              </span>
            </button>
            <div
              id={`sa-faq-panel-${index}`}
              hidden={!isOpen}
              className="pb-5 pr-8 text-sm leading-7 text-muted-foreground"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
