'use client';

import { useState } from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={item.question}
            className="rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm transition hover:border-primary/50"
          >
            <button
              type="button"
              onClick={() => handleToggle(index)}
              className="flex w-full items-center justify-between text-left"
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${index}`}
            >
              <span className="text-base font-semibold text-card-foreground">{item.question}</span>
              <span className="ml-4 text-xl text-primary" aria-hidden>
                {isOpen ? '−' : '+'}
              </span>
            </button>
            <div
              id={`faq-panel-${index}`}
              hidden={!isOpen}
              className="mt-3 text-sm text-muted-foreground"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
