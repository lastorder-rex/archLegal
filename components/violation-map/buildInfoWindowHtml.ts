import { fmtDay } from '@/lib/utils/map-geometry';
import { ICON_COPY, ICON_ROADVIEW, ICON_X } from './map-constants';
import type { ViolationItem } from './types';

// 마커 클릭 시 InfoWindow에 넣을 HTML 문자열을 만든다.
// InfoWindow는 HTML 문자열이라 onclick 핸들러가 window.__viol* 전역을 호출한다(컴포넌트가 셋업).
// 마크업/따옴표 escape는 원본 그대로 유지해야 한다(naver InfoWindow 렌더 호환).
export function buildViolationInfoWindowHtml(it: ViolationItem): string {
  const nameHtml = it.name
    ? `<div style="font-size:16px;font-weight:800;color:#191F28;margin-bottom:4px">${it.name}</div>`
    : '';
  const addrHtml = it.jibun
    ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:${it.name ? 13 : 16}px;font-weight:${it.name ? 400 : 800};color:#191F28">
               <span>📍 ${it.jibun}</span>
               <span title="주소 복사" style="cursor:pointer;display:inline-flex;align-items:center"
                 onclick="window.__violCopyAddr(this, '${it.jibun}')">${ICON_COPY}</span>
             </div>`
    : '';
  return `
          <div style="position:relative;padding:14px 16px;min-width:220px;font-family:inherit">
            <button onclick="window.__violCloseInfo()" title="닫기"
              style="position:absolute;top:8px;right:8px;background:none;border:none;padding:2px;cursor:pointer;display:flex;align-items:center;justify-content:center">${ICON_X}</button>
            <div style="font-size:11px;font-weight:800;color:#E5484D;margin-bottom:6px">위반건축물</div>
            ${nameHtml}
            ${addrHtml}
            <div style="font-size:13px;color:#6B7684;line-height:1.7">
              용도: <b style="color:#191F28">${it.useName}</b><br/>
              ${it.floors ? `지상 ${it.floors}층 · ` : ''}사용승인 ${fmtDay(it.useaprDay)}
            </div>
            <button onclick="window.__violRoadview(${it.lat}, ${it.lon}, '${(it.jibun || it.name || '').replace(/'/g, '')}')"
              style="width:100%;margin-top:12px;padding:10px 0;background:#191F28;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
              ${ICON_ROADVIEW}로드뷰로 실제 건물 보기
            </button>
            <div style="display:flex;gap:8px;margin-top:8px">
              <a href="/enforcement-fine" style="flex:1;text-align:center;padding:9px 0;background:#1B64DA;color:#fff;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none">이행강제금 계산</a>
              <a href="/check" style="flex:1;text-align:center;padding:9px 0;background:#F7F8FA;color:#191F28;border:1px solid #E5E8EB;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none">자가진단</a>
            </div>
          </div>`;
}
