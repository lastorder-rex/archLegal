import { SEOUL_GEO_PATHS, SEOUL_GEO_VIEWBOX } from '@/lib/constants/seoul-geo';

// 서울 전체 자치구 경계 위에 해당 구만 하이라이트하는 SVG 지도.
// 순수 SVG(서버 컴포넌트) — 추가 네트워크 요청 없이 인라인 렌더, 테마 색상(CSS 변수) 사용.
export function DistrictMap({ name, className }: { name: string; className?: string }) {
  const active = SEOUL_GEO_PATHS[name];
  if (!active) return null;

  return (
    <svg
      viewBox={SEOUL_GEO_VIEWBOX}
      className={className}
      role="img"
      aria-label={`서울특별시 ${name} 위치 지도`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 배경: 서울 전체 자치구 (연한 회색) */}
      {Object.entries(SEOUL_GEO_PATHS).map(([n, d]) =>
        n === name ? null : (
          <path
            key={n}
            d={d}
            style={{ fill: 'hsl(var(--muted))', stroke: 'hsl(var(--background))', strokeWidth: 1 }}
          />
        )
      )}
      {/* 강조: 해당 구 (primary) */}
      <path
        d={active}
        style={{ fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 1.4 }}
      />
    </svg>
  );
}
