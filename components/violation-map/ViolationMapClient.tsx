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
// https://lucide.dev/icons/x (InfoWindow 닫기)
const ICON_X =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7684" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
// https://lucide.dev/icons/maximize-2 , minimize-2 (미니맵 확대/축소)
const ICON_EXPAND =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#191F28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>';
const ICON_SHRINK =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#191F28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/></svg>';
// 우측 툴바 아이콘 (stroke=currentColor로 활성/비활성 색 전환)
const ICON_STREET =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_LOCATE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>';
const ICON_RULER =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>';
// https://lucide.dev/icons/map-pin (검색 위치 핀)
const ICON_PIN =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#E5484D" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#fff" stroke="none"/></svg>';

declare global {
  interface Window {
    naver: any;
    __violCopyAddr?: (el: HTMLElement, text: string) => void;
    __violRoadview?: (lat: number, lon: number, label: string) => void;
    __violCloseInfo?: () => void;
  }
}

const fmtDay = (d: string | null) =>
  d && d.length === 8 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}` : '-';

// 두 좌표 간 거리(m) — 하버사인
function haversine(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(2)}km` : `${Math.round(m)}m`);

export function ViolationMapClient() {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const infoRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panoElRef = useRef<HTMLDivElement>(null);
  const panoRef = useRef<any>(null);
  const miniElRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<any>(null);
  const miniMarkerRef = useRef<any>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pano, setPano] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [panoMsg, setPanoMsg] = useState<string | null>(null);
  const [miniExpanded, setMiniExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'marker' | 'sigungu' | 'bjdong'>('marker');
  const [searchQ, setSearchQ] = useState('');
  const [results, setResults] = useState<Array<{ address: string; lat: number; lon: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const searchMarkerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [streetOn, setStreetOn] = useState(false);
  const [measureOn, setMeasureOn] = useState(false);
  const [measureDist, setMeasureDist] = useState(0);
  const streetLayerRef = useRef<any>(null);
  const locMarkerRef = useRef<any>(null);
  const measurePointsRef = useRef<Array<{ lat: number; lon: number }>>([]);
  const measureMarkersRef = useRef<any[]>([]);
  const measurePolylineRef = useRef<any>(null);

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
        setViewMode('marker');
        setCount(d.total);
        setError(null);
      })
      .catch((e) => setError(e.message || '데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  // 줌아웃 시 구/동 단위 집계(클러스터) 로드. 클릭하면 확대.
  const loadClusters = useCallback((level: 'sigungu' | 'bjdong') => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver) return;
    setLoading(true);
    fetch(`/api/violation/clusters?level=${level}`)
      .then((r) => r.json())
      .then((d: { ok: boolean; clusters: Array<{ code: string; name: string; count: number; lat: number; lon: number }> }) => {
        if (!d.ok) throw new Error('집계 조회 실패');
        const b = map.getBounds();
        const sw = b.getSW();
        const ne = b.getNE();
        const inView = d.clusters.filter((c) => c.lat >= sw.lat() && c.lat <= ne.lat() && c.lon >= sw.lng() && c.lon <= ne.lng());
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        inView.forEach((c) => {
          const size = c.count >= 1000 ? 58 : c.count >= 300 ? 50 : c.count >= 80 ? 42 : 34;
          const marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(c.lat, c.lon),
            map,
            title: `${c.name} ${c.count}건`,
            icon: {
              content: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:rgba(27,100,218,.92);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);color:#fff;font-size:${size >= 50 ? 15 : 13}px;font-weight:800;font-family:inherit;cursor:pointer">${c.count}</div>`,
              anchor: new naver.maps.Point(size / 2, size / 2),
            },
          });
          naver.maps.Event.addListener(marker, 'click', () => {
            map.morph(new naver.maps.LatLng(c.lat, c.lon), Math.min(map.getZoom() + 3, 16));
          });
          markersRef.current.push(marker);
        });
        setViewMode(level);
        setCount(inView.reduce((a, c) => a + c.count, 0));
        setError(null);
      })
      .catch((e) => setError(e.message || '데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  // 줌 레벨에 따라 개별 마커 / 동 클러스터 / 구 클러스터 선택
  const refreshView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const z = map.getZoom();
    if (z >= 15) loadMarkers();
    else loadClusters(z < 13 ? 'sigungu' : 'bjdong');
  }, [loadMarkers, loadClusters]);

  // 주소 검색 → 후보 조회
  const doSearch = useCallback((q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    fetch(`/api/violation/geocode?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d: { ok: boolean; items: Array<{ address: string; lat: number; lon: number }> }) => {
        setResults(d.ok ? d.items : []);
      })
      .catch(() => setResults([]))
      .finally(() => {
        setSearching(false);
        setSearchDone(true);
      });
  }, []);

  // 검색 후보 선택 → 지도 이동 + 핀 표시
  const goToResult = useCallback((it: { address: string; lat: number; lon: number }) => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver) return;
    const pos = new naver.maps.LatLng(it.lat, it.lon);
    map.morph(pos, 16);
    setSearchQ(it.address);
    setResults([]);
    setSearchDone(false);
    if (searchMarkerRef.current) searchMarkerRef.current.setMap(null);
    searchMarkerRef.current = new naver.maps.Marker({
      position: pos,
      map,
      zIndex: 1000,
      title: `${it.address} · 클릭하면 로드뷰`,
      icon: {
        content: `<div style="transform:translate(-50%,-100%);filter:drop-shadow(0 2px 3px rgba(0,0,0,.4));cursor:pointer">${ICON_PIN}</div>`,
        anchor: new naver.maps.Point(0, 0),
      },
    });
    // 검색 핀 클릭 → 위반건축물이 아니어도 해당 위치 로드뷰 열기
    naver.maps.Event.addListener(searchMarkerRef.current, 'click', () => {
      setPanoMsg(null);
      setPano({ lat: it.lat, lon: it.lon, label: it.address });
    });
  }, []);

  // === 우측 툴바 기능 ===
  const clearMeasure = useCallback(() => {
    measureMarkersRef.current.forEach((m) => m.setMap(null));
    measureMarkersRef.current = [];
    measurePolylineRef.current?.setMap(null);
    measurePolylineRef.current = null;
    measurePointsRef.current = [];
    setMeasureDist(0);
  }, []);

  const addMeasurePoint = useCallback((lat: number, lon: number) => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver) return;
    measurePointsRef.current.push({ lat, lon });
    measureMarkersRef.current.push(
      new naver.maps.Marker({
        position: new naver.maps.LatLng(lat, lon),
        map,
        icon: {
          content: '<div style="width:10px;height:10px;border-radius:50%;background:#1B64DA;border:2px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.4)"></div>',
          anchor: new naver.maps.Point(5, 5),
        },
      })
    );
    const path = measurePointsRef.current.map((p) => new naver.maps.LatLng(p.lat, p.lon));
    if (measurePolylineRef.current) measurePolylineRef.current.setPath(path);
    else measurePolylineRef.current = new naver.maps.Polyline({ path, strokeColor: '#1B64DA', strokeWeight: 4, strokeOpacity: 0.9, map });
    let d = 0;
    const pts = measurePointsRef.current;
    for (let i = 1; i < pts.length; i++) d += haversine(pts[i - 1], pts[i]);
    setMeasureDist(d);
  }, []);

  // 거리뷰 레이어 토글 (네이버처럼 거리뷰 가능 도로를 파란 선으로 표시 → 클릭 시 로드뷰)
  const toggleStreet = useCallback(() => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver) return;
    setStreetOn((prev) => {
      const next = !prev;
      if (next) {
        streetLayerRef.current = new naver.maps.StreetLayer();
        streetLayerRef.current.setMap(map);
      } else {
        streetLayerRef.current?.setMap(null);
        streetLayerRef.current = null;
      }
      return next;
    });
  }, []);

  // 측정 토글 (켜면 클릭으로 점 추가, 끄면 초기화)
  const toggleMeasure = useCallback(() => {
    setMeasureOn((prev) => {
      const next = !prev;
      if (!next) clearMeasure();
      return next;
    });
  }, [clearMeasure]);

  // 현재 위치
  const goCurrentLocation = useCallback(() => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver) return;
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = new naver.maps.LatLng(p.coords.latitude, p.coords.longitude);
        map.morph(pos, 16);
        if (locMarkerRef.current) locMarkerRef.current.setMap(null);
        locMarkerRef.current = new naver.maps.Marker({
          position: pos,
          map,
          zIndex: 900,
          icon: {
            content: '<div style="width:16px;height:16px;border-radius:50%;background:#1B64DA;border:3px solid #fff;box-shadow:0 0 0 2px rgba(27,100,218,.4),0 1px 3px rgba(0,0,0,.4)"></div>',
            anchor: new naver.maps.Point(8, 8),
          },
        });
      },
      () => setError('현재 위치를 가져올 수 없습니다. (위치 권한 확인)')
    );
  }, []);

  // 지도 클릭 → 측정 모드면 점 추가 / 거리뷰 모드면 로드뷰 열기
  useEffect(() => {
    const map = mapRef.current;
    const { naver } = window;
    if (!mapReady || !map || !naver) return;
    const listener = naver.maps.Event.addListener(map, 'click', (e: { coord: { lat: () => number; lng: () => number } }) => {
      const lat = e.coord.lat();
      const lon = e.coord.lng();
      if (measureOn) addMeasurePoint(lat, lon);
      else if (streetOn) {
        setPanoMsg(null);
        setPano({ lat, lon, label: '거리뷰' });
      }
    });
    return () => naver.maps.Event.removeListener(listener);
  }, [mapReady, measureOn, streetOn, addMeasurePoint]);

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

    // InfoWindow 닫기 (X 버튼)
    window.__violCloseInfo = () => {
      try { infoRef.current?.close(); } catch { /* noop */ }
    };

    mapRef.current = new naver.maps.Map(mapElRef.current, {
      center: new naver.maps.LatLng(37.4975, 126.848),
      zoom: 15,
      zoomControl: true,
      zoomControlOptions: { position: naver.maps.Position.RIGHT_BOTTOM },
    });
    infoRef.current = new naver.maps.InfoWindow({ borderWidth: 0, disableAnchor: false, pixelOffset: new naver.maps.Point(0, -4) });

    naver.maps.Event.addListener(mapRef.current, 'idle', () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
      loadTimerRef.current = setTimeout(refreshView, 250);
    });
    setMapReady(true);
    refreshView();
  }, [scriptReady, refreshView]);

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
      pov: { pan: 0, tilt: 0, fov: 80 }, // 중간 시야각 → 확대/축소 양방향 여유
      logoControl: false,
      zoomControl: true,
    });
    naver.maps.Event.addListener(panoRef.current, 'pano_status', (status: string) => {
      setPanoMsg(status === 'OK' ? null : '이 위치 주변에는 거리뷰가 없습니다.');
    });

    // 미니맵 (네이버 로드뷰 스타일): 현재 위치를 작은 지도로 표시, 로드뷰 이동 시 동기화
    if (miniElRef.current) {
      const start = new naver.maps.LatLng(pano.lat, pano.lon);
      miniMapRef.current = new naver.maps.Map(miniElRef.current, {
        center: start,
        zoom: 15, // 한 단계 축소 → 더 넓은 영역 표시

        draggable: false,
        scrollWheel: false,
        pinchZoom: false,
        disableDoubleClickZoom: true,
        zoomControl: false,
        logoControl: false,
        mapDataControl: false,
        scaleControl: false,
      });
      miniMarkerRef.current = new naver.maps.Marker({
        position: start,
        map: miniMapRef.current,
        icon: {
          content: '<div style="width:14px;height:14px;border-radius:50%;background:#E5484D;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.6)"></div>',
          anchor: new naver.maps.Point(7, 7),
        },
      });
      // 로드뷰에서 이동(다른 파노라마로 전환)하면 미니맵도 따라감
      naver.maps.Event.addListener(panoRef.current, 'pano_changed', () => {
        const p = panoRef.current?.getPosition?.();
        if (p && miniMapRef.current) {
          miniMapRef.current.setCenter(p);
          miniMarkerRef.current?.setPosition(p);
        }
      });
      // 컨테이너 크기 확정 후 타일이 제대로 그려지도록 리사이즈 보정
      window.setTimeout(() => {
        if (miniMapRef.current && window.naver) {
          window.naver.maps.Event.trigger(miniMapRef.current, 'resize');
          miniMapRef.current.setCenter(start);
        }
      }, 300);
    }
  }, [pano]);

  // 미니맵 확대/축소 시 지도 리사이즈 + 중심 보정
  useEffect(() => {
    if (!miniMapRef.current || !window.naver) return;
    const t = window.setTimeout(() => {
      window.naver.maps.Event.trigger(miniMapRef.current, 'resize');
      const p = miniMarkerRef.current?.getPosition?.();
      if (p) miniMapRef.current.setCenter(p);
    }, 60);
    return () => window.clearTimeout(t);
  }, [miniExpanded]);

  const closeRoadview = () => {
    if (panoRef.current) {
      try { panoRef.current.destroy(); } catch { /* noop */ }
      panoRef.current = null;
    }
    miniMapRef.current = null;
    miniMarkerRef.current = null;
    setMiniExpanded(false);
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

        {/* 주소 검색창 (상단 중앙) */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(92vw, 380px)',
            zIndex: 20,
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              doSearch(searchQ);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 12px rgba(0,0,0,.15)',
              padding: '8px 10px 8px 14px',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7684" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={searchQ}
              onChange={(e) => {
                setSearchQ(e.target.value);
                setSearchDone(false);
              }}
              placeholder="주소 검색 (예: 구로구 경인로 445)"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#191F28', background: 'transparent' }}
            />
            {searchQ && (
              <button
                type="button"
                onClick={() => {
                  setSearchQ('');
                  setResults([]);
                  setSearchDone(false);
                  if (searchMarkerRef.current) {
                    searchMarkerRef.current.setMap(null);
                    searchMarkerRef.current = null;
                  }
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#6B7684' }}
                title="지우기"
                dangerouslySetInnerHTML={{ __html: ICON_X }}
              />
            )}
            <button
              type="submit"
              style={{ flexShrink: 0, background: '#1B64DA', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              {searching ? '검색중' : '검색'}
            </button>
          </form>

          {results.length > 0 && (
            <div
              style={{
                marginTop: 6,
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 2px 12px rgba(0,0,0,.15)',
                overflow: 'hidden',
                maxHeight: '50vh',
                overflowY: 'auto',
              }}
            >
              {results.map((it, i) => (
                <button
                  key={`${it.address}-${i}`}
                  onClick={() => goToResult(it)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    borderTop: i === 0 ? 'none' : '1px solid #F2F4F6',
                    padding: '11px 14px',
                    fontSize: 13.5,
                    color: '#191F28',
                    cursor: 'pointer',
                  }}
                >
                  {it.address}
                </button>
              ))}
            </div>
          )}
          {searchDone && !searching && searchQ.trim().length >= 2 && results.length === 0 && (
            <div style={{ marginTop: 6, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,.15)', padding: '11px 14px', fontSize: 13, color: '#6B7684' }}>
              검색 결과가 없습니다.
            </div>
          )}
        </div>

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
            {loading
              ? '불러오는 중…'
              : count == null
                ? '지도를 움직여 조회'
                : viewMode === 'marker'
                  ? `현재 화면 · 주거 위반 ${count.toLocaleString()}건`
                  : `${viewMode === 'sigungu' ? '구' : '동'}별 묶음 · ${count.toLocaleString()}건 (클릭·확대 시 개별 표시)`}
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

        {/* 우측 세로 툴바 (거리뷰 / 현재위치 / 측정) */}
        <div
          style={{
            position: 'absolute',
            top: 120,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 15,
          }}
        >
          {(
            [
              { key: 'street', icon: ICON_STREET, label: '거리뷰', active: streetOn, onClick: toggleStreet },
              { key: 'locate', icon: ICON_LOCATE, label: '현재 위치', active: false, onClick: goCurrentLocation },
              { key: 'measure', icon: ICON_RULER, label: '거리 측정', active: measureOn, onClick: toggleMeasure },
            ] as const
          ).map((b) => (
            <button
              key={b.key}
              onClick={b.onClick}
              title={b.label}
              aria-label={b.label}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: '1px solid #E5E8EB',
                background: b.active ? '#1B64DA' : '#fff',
                color: b.active ? '#fff' : '#454C53',
                boxShadow: '0 2px 8px rgba(0,0,0,.12)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              dangerouslySetInnerHTML={{ __html: b.icon }}
            />
          ))}
        </div>

        {/* 측정 안내/결과 (하단 중앙) */}
        {measureOn && (
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#191F28',
              color: '#fff',
              borderRadius: 10,
              boxShadow: '0 2px 12px rgba(0,0,0,.3)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              zIndex: 15,
              fontSize: 14,
            }}
          >
            <span>
              {measurePointsRef.current.length < 2 ? '지도를 클릭해 거리를 측정하세요' : <b>총 {fmtDist(measureDist)}</b>}
            </span>
            <button
              onClick={clearMeasure}
              style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              초기화
            </button>
          </div>
        )}

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
              zIndex: 1000, // 지도 줌 컨트롤(z-index ~100)이 위로 비쳐 보이지 않도록 충분히 높게
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

            {/* 미니맵 (우측 하단, 확대/축소 토글) — 패노라마 WebGL 캔버스 위에 확실히 올리려 fixed + 최상위 z-index */}
            <div
              style={{
                position: 'fixed',
                right: 16,
                bottom: 16,
                width: miniExpanded ? 'min(70vw, 420px)' : 180,
                height: miniExpanded ? 'min(60vh, 320px)' : 130,
                borderRadius: 10,
                overflow: 'hidden',
                border: '2px solid #fff',
                boxShadow: '0 3px 12px rgba(0,0,0,.5)',
                transition: 'width .15s, height .15s',
                zIndex: 9999, // 패노라마 내부 캔버스(z-index ~100)보다 위에 올라오도록
              }}
            >
              <div ref={miniElRef} style={{ width: '100%', height: '100%', background: '#e8e8e8' }} />
              <button
                onClick={() => setMiniExpanded((v) => !v)}
                title={miniExpanded ? '미니맵 축소' : '미니맵 확대'}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 28,
                  height: 28,
                  background: 'rgba(255,255,255,.95)',
                  border: 'none',
                  borderRadius: 6,
                  boxShadow: '0 1px 3px rgba(0,0,0,.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}
                dangerouslySetInnerHTML={{ __html: miniExpanded ? ICON_SHRINK : ICON_EXPAND }}
              />
            </div>
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
