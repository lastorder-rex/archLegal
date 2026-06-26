import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';

// home-v2 실험 섹션 — 「내 집 양성화 리포트」 아래에 더하는 브랜드 포스터.
// 레퍼런스(nono) 무드: 딥그린×핑크 컬러블로킹 + 거대 타이포 + 제품 카드 오마주.
// 색상은 브랜드 전용 팔레트라 테마 토큰이 아닌 인라인 HEX로 고정.
const C = {
  green: '#01693F', // 메인 딥그린
  greenLight: '#038250', // 밝은 그린(하이라이트)
  greenDark: '#043319', // 어두운 그린(그림자)
  pink: '#FC7DAF', // 메인 핑크
  pinkLight: '#FE85B4', // 밝은 핑크
  pinkDark: '#57161A', // 진한 핑크/그림자
  brown: '#A6643B', // 사료 브라운(액센트)
};

export function LandingBrandPoster() {
  return (
    <section aria-label="양성화 브랜드" style={{ backgroundColor: C.green }}>
      <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-28">
        {/* eyebrow */}
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide"
          style={{ backgroundColor: C.pink, color: C.greenDark }}
        >
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: C.brown }} />
          특정건축물 정리 특별조치법 · 신청 마감 ~2028.6.16
        </span>

        {/* 거대 워드마크 */}
        <h2
          className="mt-6 font-extrabold leading-[0.9] tracking-tighter"
          style={{ color: C.pink, fontSize: 'clamp(3.5rem, 13vw, 10rem)' }}
        >
          양성화
          <span style={{ color: C.pinkLight, fontSize: '0.32em' }} className="align-top">
            .com
          </span>
        </h2>
        <p
          className="mt-4 max-w-xl text-lg font-semibold leading-7 sm:text-xl"
          style={{ color: C.pinkLight }}
        >
          위반건축물을 ‘법’으로 합법화하는, 단 하나의 진단·상담 플랫폼.
        </p>

        {/* 제품 카드(그릇 오마주) — 핑크 보드 위 그린 카드 */}
        <div
          className="mt-12 overflow-hidden rounded-[2rem]"
          style={{ backgroundColor: C.pink }}
        >
          <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1.25fr_1fr]">
            {/* 좌: 카피 + CTA */}
            <div>
              <p className="text-xs font-extrabold tracking-[0.25em]" style={{ color: C.pinkDark }}>
                MY BUILDING IS LEGAL
              </p>
              <h3
                className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
                style={{ color: C.greenDark }}
              >
                내 건물의 이름을
                <br />
                되찾으세요
              </h3>
              <p className="mt-4 max-w-md text-sm leading-6 sm:text-base" style={{ color: C.green }}>
                주소만 넣으면 <b>위반 등재 여부 · 이행강제금 · 양성화 가능성</b>을 한 화면에서. 30초,
                로그인 없이 무료로 확인합니다.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/check"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-base font-extrabold transition hover:opacity-90"
                  style={{ backgroundColor: C.green, color: C.pink }}
                >
                  30초 무료 진단
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </Link>
                <Link
                  href="/qna"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 px-5 text-base font-bold transition hover:opacity-80"
                  style={{ borderColor: C.greenDark, color: C.greenDark }}
                >
                  3D 위반사례
                </Link>
              </div>
            </div>

            {/* 우: 그린 오브제(그릇 자리) */}
            <div
              className="relative flex aspect-square items-center justify-center rounded-[1.75rem]"
              style={{ backgroundColor: C.green, boxShadow: `0 18px 0 ${C.greenDark}` }}
            >
              <Building2 className="h-28 w-28" style={{ color: C.pink }} aria-hidden strokeWidth={1.4} />
              <span
                className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-extrabold tracking-tight"
                style={{ color: C.pink }}
              >
                내 집도, 양성화
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
