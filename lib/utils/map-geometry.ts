// 위반건축물 지도의 순수 기하/포맷 유틸. React·naver 의존 없음.

export type LatLon = { lat: number; lon: number };

// 측정/면적 힌트박스 크기(컴포넌트 렌더 폭과 computeHintPos 클램프에 공통 사용).
export const AREA_HINT_WIDTH = 166;
export const AREA_HINT_HEIGHT = 82;

export const fmtDay = (d: string | null) =>
  d && d.length === 8 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}` : '-';

// 두 좌표 간 거리(m) — 하버사인
export function haversine(a: LatLon, b: LatLon) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(2)}km` : `${Math.round(m)}m`);
export const fmtArea = (sqm: number) => (sqm >= 10000 ? `${(sqm / 10000).toFixed(2)}ha` : `${Math.round(sqm).toLocaleString()}㎡`);

export function totalDistance(points: LatLon[]) {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversine(points[i - 1], points[i]);
  return d;
}

export function polygonArea(points: LatLon[]) {
  if (points.length < 3) return 0;
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const projected = points.map((p) => ({
    x: R * toRad(p.lon) * Math.cos(toRad(avgLat)),
    y: R * toRad(p.lat),
  }));
  let area = 0;
  for (let i = 0; i < projected.length; i++) {
    const j = (i + 1) % projected.length;
    area += projected[i].x * projected[j].y - projected[j].x * projected[i].y;
  }
  return Math.abs(area) / 2;
}

// 마우스 커서 옆 힌트박스의 위치(컨테이너 안에 들어오도록 모서리에서 뒤집고 클램프).
export function computeHintPos(el: HTMLElement, e: MouseEvent) {
  const rect = el.getBoundingClientRect();
  let x = e.clientX - rect.left + 16;
  let y = e.clientY - rect.top + 16;
  if (x + AREA_HINT_WIDTH > rect.width) x = e.clientX - rect.left - AREA_HINT_WIDTH - 16;
  if (y + AREA_HINT_HEIGHT > rect.height) y = e.clientY - rect.top - AREA_HINT_HEIGHT - 16;
  return {
    x: Math.max(8, Math.min(x, rect.width - AREA_HINT_WIDTH - 8)),
    y: Math.max(8, Math.min(y, rect.height - AREA_HINT_HEIGHT - 8)),
  };
}
