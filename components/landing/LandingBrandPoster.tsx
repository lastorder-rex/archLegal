import { Search, ShieldCheck } from 'lucide-react';

// home-v2 실험 — 「내 집, 위반건축물일까요?」(MyBuildingReport idle) 와 동일한 구조·텍스트·버튼을
// 그대로 두고 색상만 nono 팔레트(딥그린×핑크)로 바꾼 디자인 시안.
// 구조 변경 없이 '색만' 교체. 진단 버튼은 상단 실제 리포트(#my-building-report)로 스크롤.
const C = {
  green: '#01693F', // 메인 딥그린
  greenDark: '#043319', // 어두운 그린(그림자)
  pink: '#FC7DAF', // 메인 핑크
  pinkLight: '#FE85B4', // 밝은 핑크(하이라이트)
  brown: '#A6643B', // 사료 브라운(액센트)
};

export function LandingBrandPoster() {
  return (
    <section aria-label="내 집 양성화 리포트 (브랜드 컬러)" style={{ backgroundColor: C.green }}>
      <div className="mx-auto w-full max-w-6xl px-6 py-14 lg:py-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1 space-y-5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{ backgroundColor: C.pink, color: C.greenDark }}
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              30초 무료 진단 · 로그인 불필요
            </span>
            <h2
              className="text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.6rem]"
              style={{ color: C.pink }}
            >
              내 집, <span style={{ color: C.pinkLight }}>위반건축물</span>일까요?
            </h2>
            <p className="max-w-xl text-base leading-7" style={{ color: C.pinkLight }}>
              주소만 넣으면 <b style={{ color: C.pink }}>건축물대장 위반 등재 여부</b>와 건물 정보, 특별조치법
              남은 시한, 이행강제금·양성화 가능성을 <b style={{ color: C.pink }}>한 화면</b>에서 확인합니다.
            </p>
            <a
              href="#my-building-report"
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-7 text-lg font-extrabold transition hover:opacity-90 sm:w-auto"
              style={{ backgroundColor: C.pink, color: C.greenDark, boxShadow: `0 10px 0 ${C.greenDark}` }}
            >
              <Search className="h-5 w-5" aria-hidden />
              내 집 주소로 진단 시작
            </a>
          </div>

          <a
            href="/qna"
            aria-label="3D 위반건축물 진단으로 이동"
            className="group relative hidden overflow-hidden rounded-2xl shadow-lg lg:block lg:flex-1"
            style={{ border: `3px solid ${C.greenDark}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/building-preview.png"
              alt="3D 건물에서 위반 부위를 짚어보는 미리보기"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <span
              className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-bold shadow-md"
              style={{ backgroundColor: C.pink, color: C.greenDark }}
            >
              3D로 직접 짚어보기 →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
