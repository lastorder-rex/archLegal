// 위반건축물 지도 상수: 용도별 마커 색, 인라인 SVG 아이콘, 정밀도 상수.

// 용도 대분류별 마커 색
export const USE_COLOR: Record<string, string> = {
  단독주택: '#1B64DA',
  공동주택: '#E5484D',
  제1종근린생활시설: '#16A34A',
  제2종근린생활시설: '#F59E0B',
};
export const colorOf = (useName: string) => USE_COLOR[useName] || '#6B7684';

// 중복 점 제거 임계(약 1.1cm). 빠른 더블클릭으로 같은 점이 두 번 찍히는 것을 막는다 — 값 변경 금지.
export const DUPLICATE_POINT_EPSILON = 0.0000001;

// Lucide 아이콘(인라인 SVG). InfoWindow가 HTML 문자열이라 컴포넌트 대신 마크업을 직접 넣는다.
// https://lucide.dev/icons/copy , https://lucide.dev/icons/check
export const ICON_COPY =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7684" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
export const ICON_CHECK =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
// https://lucide.dev/icons/eye (로드뷰 버튼용, 흰색)
export const ICON_ROADVIEW =
  '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';
// https://lucide.dev/icons/x (InfoWindow 닫기)
export const ICON_X =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7684" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
// https://lucide.dev/icons/maximize-2 , minimize-2 (미니맵 확대/축소)
export const ICON_EXPAND =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#191F28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>';
export const ICON_SHRINK =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#191F28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/></svg>';
// 우측 툴바 아이콘 (stroke=currentColor로 활성/비활성 색 전환)
export const ICON_STREET =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';
export const ICON_AREA =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5 10 4l8 3 2 8-6 5-8-3-2-9.5Z"/><circle cx="10" cy="4" r="1.5" fill="currentColor" stroke="none"/><circle cx="18" cy="7" r="1.5" fill="currentColor" stroke="none"/><circle cx="20" cy="15" r="1.5" fill="currentColor" stroke="none"/><circle cx="14" cy="20" r="1.5" fill="currentColor" stroke="none"/><circle cx="6" cy="17" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="7.5" r="1.5" fill="currentColor" stroke="none"/></svg>';
export const ICON_RULER =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>';
// https://lucide.dev/icons/map-pin (검색 위치 핀)
export const ICON_PIN =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#E5484D" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#fff" stroke="none"/></svg>';
