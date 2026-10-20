import Link from 'next/link';
import { Building2, ChevronRight, MousePointerClick } from 'lucide-react';

// home-v2 히어로(주소 진단) 바로 아래 — 사라진 3D 위반사례 후크를 되살린다.
// 보는 콘텐츠가 아니라 "내 건물에 대입"하는 진입점으로 /qna3d 3D 사례로 연결.
// 미리보기 이미지는 /qna3d 실제 캡처(3d1.webp) — 씬이 바뀌면 캡처도 갱신할 것.
export function Landing3DPreview() {
  return (
    <section className="border-y border-border bg-muted/20" aria-label="3D 위반사례">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            3D 위반사례
          </span>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-[2.4rem]">
            위반 부위, <span className="text-primary">3D로 직접</span> 짚어보세요
          </h2>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            옥탑·발코니·필로티 주차장·무단증축 — 흔한 위반 유형을 3D 건물 위에서 클릭해보고, 내 집과 가장
            가까운 사례의 <b className="text-foreground">적발 사유·양성화 가능성·필요 조치</b>를 확인하세요.
          </p>
          <Link
            href="/qna3d"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-base font-extrabold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
          >
            <MousePointerClick className="h-5 w-5" aria-hidden />
            3D로 위반사례 보기
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <Link
          href="/qna3d"
          aria-label="3D 위반건축물 사례로 이동"
          className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/3d1.webp"
            width={1380}
            height={918}
            alt="3D 건물에서 위반 부위 12곳을 짚어보는 미리보기"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-md">
            3D로 직접 짚어보기 →
          </span>
        </Link>
      </div>
    </section>
  );
}
