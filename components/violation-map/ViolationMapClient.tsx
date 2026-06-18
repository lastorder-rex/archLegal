'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

// 위반건축물 지도 (네이버지도 + 마커).
// 데이터: GET /api/violation/map (Supabase). 지도를 움직일 때마다 화면 영역(bbox)으로
// 조회해 보이는 마커만 렌더 → 서울·전국으로 데이터가 늘어도 가벼움.

type ViolationItem = {
  pnu: string;
  name: string | null;
  jibun: string | null;
  useName: string;
  residential: boolean;
  floors: number | null;
  useaprDay: string | null;
  lat: number;
  lon: number;
};

type ApiResponse = {
  ok: boolean;
  total: number;
  items: ViolationItem[];
};

// 용도 대분류별 마커 색
const USE_COLOR: Record<string, string> = {
  단독주택: '#1B64DA',
  공동주택: '#E5484D',
  제1종근린생활시설: '#16A34A',
  제2종근린생활시설: '#F59E0B',
};
const colorOf = (useName: string) => USE_COLOR[useName] || '#6B7684';

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

// Lucide 아이콘(인라인 SVG). InfoWindow가 HTML 문자열이라 컴포넌트 대신 마크업을 직접 넣는다.
// https://lucide.dev/icons/copy , https://lucide.dev/icons/check
const ICON_COPY =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7684" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
const ICON_CHECK =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
// https://lucide.dev/icons/eye (로드뷰 버튼용, 흰색)
const ICON_ROADVIEW =
  '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';

declare global {
  interface Window {
    naver: any;
    __violCopyAddr?: (el: HTMLElement, text: string) => void;
    __violRoadview?: (lat: number, lon: number, label: string) => void;
  }
}

const fmtDay = (d: string | null) =>
  d && d.length === 8 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}` : '-';

export function ViolationMapClient() {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const infoRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panoElRef = useRef<HTMLDivElement>(null);
  const panoRef = useRef<any>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pano, setPano] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [panoMsg, setPanoMsg] = useState<string | null>(null);

  // 현재 지도 영역(bbox)으로 마커 로드. 이전 마커는 지우고 새로 그린다.
  const loadMarkers = useCallback(() => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver) return;
    const b = map.getBounds();
    const sw = b.getSW();
    const ne = b.getNE();
    const bbox = `${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()}`;
    setLoading(true);
    fetch(`/api/violation/map?residential=1&bbox=${bbox}`)
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        if (!d.ok) throw new Error('데이터 조회 실패');
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        d.items.forEach((it) => {
          const marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(it.lat, it.lon),
            map,
            title: it.name || it.useName,
            icon: {
              content: `<div style="width:14px;height:14px;border-radius:50%;background:${colorOf(it.useName)};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
              anchor: new naver.maps.Point(7, 7),
            },
          });
          naver.maps.Event.addListener(marker, 'click', () => openInfo(map, marker, it));
          markersRef.current.push(marker);
        });
        setCount(d.total);
        setError(null);
      })
      .catch((e) => setError(e.message || '데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  // 지도 1회 초기화 + 이동(idle) 시 디바운스 로드
  useEffect(() => {
    if (!scriptReady || !mapElRef.current || mapRef.current || !window.naver) return;
    const { naver } = window;

    // InfoWindow(HTML 문자열)의 onclick에서 호출할 복사 핸들러. 성공 시 check 아이콘으로 잠깐 전환.
    window.__violCopyAddr = (el, text) => {
      navigator.clipboard.writeText(text).then(() => {
        el.innerHTML = ICON_CHECK;
        window.setTimeout(() => {
          el.innerHTML = ICON_COPY;
        }, 1200);
      });
    };

    // 로드뷰(거리뷰) 오버레이 열기
    window.__violRoadview = (lat, lon, label) => {
      setPanoMsg(null);
      setPano({ lat, lon, label });
    };

    mapRef.current = new naver.maps.Map(mapElRef.current, {
      center: new naver.maps.LatLng(37.4975, 126.848),
      zoom: 15,
      zoomControl: true,
      zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT },
    });
    infoRef.current = new naver.maps.InfoWindow({ borderWidth: 0, disableAnchor: false, pixelOffset: new naver.maps.Point(0, -4) });

    naver.maps.Event.addListener(mapRef.current, 'idle', () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
      loadTimerRef.current = setTimeout(loadMarkers, 250);
    });
    loadMarkers();
  }, [scriptReady, loadMarkers]);

  // 로드뷰 오버레이가 열리면 해당 좌표의 거리뷰(Panorama) 생성
  useEffect(() => {
    if (!pano || !window.naver || !panoElRef.current) return;
    const { naver } = window;
    if (panoRef.current) {
      try { panoRef.current.destroy(); } catch { /* noop */ }
      panoRef.current = null;
    }
    panoRef.current = new naver.maps.Panorama(panoElRef.current, {
      position: new naver.maps.LatLng(pano.lat, pano.lon),
      pov: { pan: 0, tilt: 0, fov: 100 },
      logoControl: false,
      zoomControl: true,
    });
    naver.maps.Event.addListener(panoRef.current, 'pano_status', (status: string) => {
      setPanoMsg(status === 'OK' ? null : '이 위치 주변에는 거리뷰가 없습니다.');
    });
  }, [pano]);

  const closeRoadview = () => {
    if (panoRef.current) {
      try { panoRef.current.destroy(); } catch { /* noop */ }
      panoRef.current = null;
    }
    setPano(null);
    setPanoMsg(null);
  };

  // 마커 클릭 시 InfoWindow 열기
  function openInfo(map: any, marker: any, it: ViolationItem) {
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
        const html = `
          <div style="padding:14px 16px;min-width:220px;font-family:inherit">
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
        infoRef.current.setContent(html);
        infoRef.current.open(map, marker);
  }

  if (!CLIENT_ID) {
    return (
      <div style={{ padding: 24, color: '#E5484D' }}>
        NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 가 설정되지 않았습니다. (.env.local 확인)
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}&submodules=panorama`}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setError('네이버 지도 로드 실패 — Client ID/도메인 등록을 확인하세요.')}
      />
      <div style={{ position: 'relative', width: '100%', height: '100dvh' }}>
        <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />

        {/* 상단 정보 카드 */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,.12)',
            padding: '14px 16px',
            maxWidth: 280,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 800, color: '#191F28' }}>위반건축물 지도</div>
          <div style={{ fontSize: 13, color: '#6B7684', marginTop: 4 }}>
            {loading ? '불러오는 중…' : count == null ? '지도를 움직여 조회' : `현재 화면 · 주거 위반 ${count}건`}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {Object.entries(USE_COLOR).map(([name, color]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7684' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {name.replace('생활시설', '')}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#9AA3AD', marginTop: 10, lineHeight: 1.5 }}>
            VWorld 등재(viol_bd_yn=1) 기준. 등재 누락분은 표시되지 않을 수 있습니다.
          </div>
        </div>

        {error && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              background: '#E5484D',
              color: '#fff',
              padding: '12px 16px',
              borderRadius: 10,
              fontSize: 13,
              zIndex: 10,
            }}
          >
            {error}
          </div>
        )}

        {/* 로드뷰(거리뷰) 오버레이 */}
        {pano && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 30,
              background: '#000',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#191F28',
                color: '#fff',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📍 {pano.label || '로드뷰'}
              </div>
              <button
                onClick={closeRoadview}
                style={{
                  background: 'rgba(255,255,255,.15)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginLeft: 12,
                }}
              >
                닫기 ✕
              </button>
            </div>
            <div ref={panoElRef} style={{ flex: 1, width: '100%' }} />
            {panoMsg && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  color: '#fff',
                  fontSize: 14,
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              >
                {panoMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
