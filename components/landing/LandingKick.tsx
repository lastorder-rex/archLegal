import Image from 'next/image';
import Link from 'next/link';
import { Building2, ClipboardCheck, MessageCircleQuestion } from 'lucide-react';
import { LandingViolationLookup } from './LandingViolationLookup';

// home-v2 "kick" 섹션 — 기존 랜딩 콘텐츠는 그대로 두고 히어로 뒤에 더한다.
//  - 좌: 주소 위반조회(즉답 = 차별 후크) + 3D/자가진단/Q&A 진입
//  - 우: 3D 건물 미리보기 → /qna(전체 인터랙티브)
// 텍스트 콘텐츠를 줄이지 않고 "더하기"만 하므로 SEO/정체성 영향 없음.
export function LandingKick() {
  return (
    <section className="border-y border-border bg-muted/20" aria-label="3D 위반건축물 진단">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
        {/* 좌: 카피 + 주소조회 */}
        <div className="space-y-5">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            위반건축물 · 양성화 진단
          </p>
          <h2 className="text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
            내 집 어딘가도
            <br />
            위반건축물일까요?
          </h2>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            주소만 넣으면 건축물대장 <b className="text-foreground">위반건축물 등재 여부</b>를 바로 확인합니다. 3D 건물에서
            옥상·발코니·주차장 위반 부위도 직접 짚어볼 수 있어요.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <LandingViolationLookup />
            <Link
              href="/qna"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-card px-6 text-base font-bold text-foreground transition hover:border-primary hover:text-primary"
            >
              3D로 위반사례 보기
            </Link>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1 text-sm">
            <Link
              href="/check"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden />
              1분 양성화 자가진단
            </Link>
            <Link
              href="/qna"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <MessageCircleQuestion className="h-4 w-4" aria-hidden />
              위반사례 Q&amp;A
            </Link>
          </div>
        </div>

        {/* 우: 3D 미리보기 → /qna */}
        <Link
          href="/qna"
          aria-label="3D 위반건축물 진단 페이지로 이동"
          className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
        >
          <Image
            src="/home/building-preview.png"
            alt="3D 건물에서 옥상·발코니·주차장 등 위반 부위를 짚어보는 미리보기"
            width={760}
            height={620}
            className="h-auto w-full transition duration-300 group-hover:scale-[1.02]"
          />
          <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-md">
            3D로 직접 짚어보기 →
          </span>
        </Link>
      </div>
    </section>
  );
}
