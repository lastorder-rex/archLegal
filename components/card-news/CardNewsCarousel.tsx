'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const cards = [
  { src: '/card1.png', alt: '양성화 카드뉴스 1번 이미지', width: 382, height: 538 },
  { src: '/card2.png', alt: '양성화 카드뉴스 2번 이미지', width: 376, height: 538 },
  { src: '/card3.png', alt: '양성화 카드뉴스 3번 이미지', width: 377, height: 539 },
  { src: '/card4.png', alt: '양성화 카드뉴스 4번 이미지', width: 385, height: 536 },
  { src: '/card5.png', alt: '양성화 카드뉴스 5번 이미지', width: 381, height: 482 },
  { src: '/card6.png', alt: '양성화 카드뉴스 6번 이미지', width: 372, height: 480 },
  { src: '/card7.png', alt: '양성화 카드뉴스 7번 이미지', width: 377, height: 482 },
  { src: '/card8.png', alt: '양성화 카드뉴스 8번 이미지', width: 386, height: 481 }
];

export function CardNewsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCard = cards[activeIndex];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === cards.length - 1;

  const move = (direction: -1 | 1) => {
    setActiveIndex(current => Math.min(cards.length - 1, Math.max(0, current + direction)));
  };

  return (
    <section aria-label="양성화 카드뉴스 슬라이드" className="w-full">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-center">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                  <Image src="/docu/archlegal-fa-p-transparent.png" alt="" width={30} height={30} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">양성화.com</p>
                  <p className="text-xs text-slate-500">인건(仁建) 양성화 전문 플랫폼</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-slate-400" aria-hidden="true">
                ...
              </span>
            </div>

            <div className="relative bg-slate-100">
              <Image
                key={activeCard.src}
                src={activeCard.src}
                alt={activeCard.alt}
                width={activeCard.width}
                height={activeCard.height}
                priority={activeIndex === 0}
                className="h-auto w-full"
                draggable={false}
              />
              {activeIndex === cards.length - 1 ? (
                <Link
                  href="/legalization-check.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="1분 양성화 자가진단 바로가기"
                  className="absolute left-[7%] top-[66%] z-10 h-[9%] w-[53%] rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              ) : null}
              <button
                type="button"
                onClick={() => move(-1)}
                disabled={isFirst}
                aria-label="이전 카드"
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow transition hover:bg-white disabled:hidden"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                disabled={isLast}
                aria-label="다음 카드"
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow transition hover:bg-white disabled:hidden"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 px-4 py-4">
              {cards.map((card, index) => (
                <button
                  key={card.src}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`${index + 1}번 카드로 이동`}
                  aria-current={activeIndex === index ? 'true' : undefined}
                  className={`h-2.5 rounded-full transition ${
                    activeIndex === index ? 'w-7 bg-primary' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {activeIndex + 1}/{cards.length}
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">핵심 내용만 빠르게 확인하세요</h2>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              특정건축물 정리 특별조치법, 신청 가능성, 준비 절차를 카드뉴스 흐름으로 정리했습니다.
              <br />
              처음 확인하는 분도 대상 여부와 다음 준비 단계를 빠르게 이해할 수 있습니다.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="font-semibold text-foreground">대상 확인</p>
              <p className="mt-1">건축물 유형과 기준을 먼저 확인합니다.</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="font-semibold text-foreground">절차 이해</p>
              <p className="mt-1">상담부터 사용승인까지 흐름을 봅니다.</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="font-semibold text-foreground">다음 행동</p>
              <p className="mt-1">자가진단과 상담 신청으로 이어집니다.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
