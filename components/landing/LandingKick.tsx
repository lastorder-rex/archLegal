import { MyBuildingReport } from './MyBuildingReport';

// home-v2 "kick" 섹션 — 기존 랜딩 콘텐츠는 그대로 두고 히어로 뒤에 「내 집 양성화 리포트」를 더한다.
// 텍스트 콘텐츠를 줄이지 않고 "더하기"만 하므로 SEO/정체성 보존.
export function LandingKick() {
  return (
    <section className="border-y border-border bg-muted/20" aria-label="내 집 양성화 리포트">
      <div className="mx-auto w-full max-w-6xl px-6 py-14 lg:py-20">
        <MyBuildingReport />
      </div>
    </section>
  );
}
