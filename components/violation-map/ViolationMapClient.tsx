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
const ICON_AREA =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5 10 4l8 3 2 8-6 5-8-3-2-9.5Z"/><circle cx="10" cy="4" r="1.5" fill="currentColor" stroke="none"/><circle cx="18" cy="7" r="1.5" fill="currentColor" stroke="none"/><circle cx="20" cy="15" r="1.5" fill="currentColor" stroke="none"/><circle cx="14" cy="20" r="1.5" fill="currentColor" stroke="none"/><circle cx="6" cy="17" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="7.5" r="1.5" fill="currentColor" stroke="none"/></svg>';
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
const fmtArea = (sqm: number) => (sqm >= 10000 ? `${(sqm / 10000).toFixed(2)}ha` : `${Math.round(sqm).toLocaleString()}㎡`);
const AREA_HINT_WIDTH = 166;
const AREA_HINT_HEIGHT = 82;

function totalDistance(points: Array<{ lat: number; lon: number }>) {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversine(points[i - 1], points[i]);
  return d;
}

function polygonArea(points: Array<{ lat: number; lon: number }>) {
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

// 측정/면적 점 표시용 작은 원형 마커. 색만 바꿔 측정(파랑)·면적(초록)에 공통 사용.
function dotMarker(naver: any, map: any, lat: number, lon: number, color: string) {
  return new naver.maps.Marker({
    position: new naver.maps.LatLng(lat, lon),
    map,
    icon: {
      content: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.4)"></div>`,
      anchor: new naver.maps.Point(5, 5),
    },
  });
}

// 마우스 커서 옆 힌트박스의 위치(컨테이너 안에 들어오도록 모서리에서 뒤집고 클램프).
function computeHintPos(el: HTMLElement, e: MouseEvent) {
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

export function ViolationMapClient() {
  const mapWrapRef = useRef<HTMLDivElement>(null);
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
  const [measureFinished, setMeasureFinished] = useState(false);
  const [measurePointCount, setMeasurePointCount] = useState(0);
  const [areaOn, setAreaOn] = useState(false);
  const [areaFinished, setAreaFinished] = useState(false);
  const [areaPointCount, setAreaPointCount] = useState(0);
  const [measureDist, setMeasureDist] = useState(0);
  const [areaSize, setAreaSize] = useState(0);
  const [measureHintPos, setMeasureHintPos] = useState<{ x: number; y: number } | null>(null);
  const [areaHintPos, setAreaHintPos] = useState<{ x: number; y: number } | null>(null);
  const streetLayerRef = useRef<any>(null);
  const measurePointsRef = useRef<Array<{ lat: number; lon: number }>>([]);
  const measureMarkersRef = useRef<any[]>([]);
  const measurePolylineRef = useRef<any>(null);
  const measurePreviewPointRef = useRef<{ lat: number; lon: number } | null>(null);
  const areaPointsRef = useRef<Array<{ lat: number; lon: number }>>([]);
  const areaMarkersRef = useRef<any[]>([]);
  const areaPolylineRef = useRef<any>(null);
  const areaPolygonRef = useRef<any>(null);
  const areaPreviewPointRef = useRef<{ lat: number; lon: number } | null>(null);

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
    measurePreviewPointRef.current = null;
    setMeasureFinished(false);
    setMeasurePointCount(0);
    setMeasureDist(0);
    setMeasureHintPos(null);
  }, []);

  const clearArea = useCallback(() => {
    areaMarkersRef.current.forEach((m) => m.setMap(null));
    areaMarkersRef.current = [];
    areaPolylineRef.current?.setMap(null);
    areaPolylineRef.current = null;
    areaPolygonRef.current?.setMap(null);
    areaPolygonRef.current = null;
    areaPointsRef.current = [];
    areaPreviewPointRef.current = null;
    setAreaFinished(false);
    setAreaPointCount(0);
    setAreaSize(0);
    setAreaHintPos(null);
  }, []);

  const updateMeasureGeometry = useCallback((previewPoint?: { lat: number; lon: number }) => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver) return;

    const points = previewPoint ? [...measurePointsRef.current, previewPoint] : measurePointsRef.current;
    const path = points.map((p) => new naver.maps.LatLng(p.lat, p.lon));
    if (path.length >= 2 && measurePolylineRef.current) {
      measurePolylineRef.current.setPath(path);
    } else if (path.length >= 2) {
      measurePolylineRef.current = new naver.maps.Polyline({ path, strokeColor: '#1B64DA', strokeWeight: 4, strokeOpacity: 0.9, map });
    } else if (measurePolylineRef.current) {
      measurePolylineRef.current.setMap(null);
      measurePolylineRef.current = null;
    }
    setMeasureDist(totalDistance(points));
  }, []);

  const addMeasurePoint = useCallback((lat: number, lon: number) => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver) return;
    measurePointsRef.current.push({ lat, lon });
    measurePreviewPointRef.current = null;
    setMeasureFinished(false);
    setMeasurePointCount(measurePointsRef.current.length);
    measureMarkersRef.current.push(dotMarker(naver, map, lat, lon, '#1B64DA'));
    updateMeasureGeometry();
  }, [updateMeasureGeometry]);

  const finishMeasure = useCallback((finalPoint?: { lat: number; lon: number }) => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver || measurePointsRef.current.length < 1) return;

    const pointToCommit = finalPoint || measurePreviewPointRef.current;
    if (pointToCommit) {
      const last = measurePointsRef.current[measurePointsRef.current.length - 1];
      const duplicated = last && Math.abs(last.lat - pointToCommit.lat) < 0.0000001 && Math.abs(last.lon - pointToCommit.lon) < 0.0000001;
      if (!duplicated) {
        measurePointsRef.current.push(pointToCommit);
        measureMarkersRef.current.push(dotMarker(naver, map, pointToCommit.lat, pointToCommit.lon, '#1B64DA'));
      }
    }

    if (measurePointsRef.current.length < 2) return;
    measurePreviewPointRef.current = null;
    updateMeasureGeometry();
    setMeasurePointCount(measurePointsRef.current.length);
    setMeasureOn(false);
    setMeasureFinished(true);
    setMeasureHintPos(null);
  }, [updateMeasureGeometry]);

  const updateAreaGeometry = useCallback((previewPoint?: { lat: number; lon: number }) => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver) return;

    const points = previewPoint ? [...areaPointsRef.current, previewPoint] : areaPointsRef.current;
    const path = points.map((p) => new naver.maps.LatLng(p.lat, p.lon));
    const outlinePath = path.length >= 3 ? [...path, path[0]] : path;

    if (outlinePath.length >= 2 && areaPolylineRef.current) {
      areaPolylineRef.current.setPath(outlinePath);
    } else if (outlinePath.length >= 2) {
      areaPolylineRef.current = new naver.maps.Polyline({
        path: outlinePath,
        map,
        strokeColor: '#16A34A',
        strokeWeight: 3,
        strokeOpacity: 0.95,
      });
    } else if (areaPolylineRef.current) {
      areaPolylineRef.current.setMap(null);
      areaPolylineRef.current = null;
    }

    if (path.length >= 3) {
      if (areaPolygonRef.current) {
        areaPolygonRef.current.setPaths(path);
      } else {
        areaPolygonRef.current = new naver.maps.Polygon({
          paths: path,
          map,
          strokeColor: '#16A34A',
          strokeWeight: 0,
          strokeOpacity: 0,
          fillColor: '#16A34A',
          fillOpacity: 0.18,
        });
      }
    } else if (areaPolygonRef.current) {
      areaPolygonRef.current.setMap(null);
      areaPolygonRef.current = null;
    }

    setAreaSize(polygonArea(points));
  }, []);

  const addAreaPoint = useCallback((lat: number, lon: number) => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver) return;
    areaPointsRef.current.push({ lat, lon });
    areaPreviewPointRef.current = null;
    setAreaFinished(false);
    setAreaPointCount(areaPointsRef.current.length);
    areaMarkersRef.current.push(dotMarker(naver, map, lat, lon, '#16A34A'));
    updateAreaGeometry();
  }, [updateAreaGeometry]);

  const finishArea = useCallback((finalPoint?: { lat: number; lon: number }) => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver || areaPointsRef.current.length < 2) return;

    const pointToCommit = finalPoint || areaPreviewPointRef.current;
    if (pointToCommit) {
      const last = areaPointsRef.current[areaPointsRef.current.length - 1];
      const duplicated = last && Math.abs(last.lat - pointToCommit.lat) < 0.0000001 && Math.abs(last.lon - pointToCommit.lon) < 0.0000001;
      if (!duplicated) {
        areaPointsRef.current.push(pointToCommit);
        areaMarkersRef.current.push(dotMarker(naver, map, pointToCommit.lat, pointToCommit.lon, '#16A34A'));
      }
    }

    if (areaPointsRef.current.length < 3) return;
    areaPreviewPointRef.current = null;
    updateAreaGeometry();
    setAreaPointCount(areaPointsRef.current.length);
    setAreaOn(false);
    setAreaFinished(true);
    setAreaHintPos(null);
  }, [updateAreaGeometry]);

  const clearStreet = useCallback(() => {
    streetLayerRef.current?.setMap(null);
    streetLayerRef.current = null;
    setStreetOn(false);
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
      if (next) {
        setAreaOn(false);
        clearArea();
        clearMeasure();
      } else clearMeasure();
      return next;
    });
  }, [clearArea, clearMeasure]);

  const toggleArea = useCallback(() => {
    setAreaOn((prev) => {
      const next = !prev;
      if (next) {
        setMeasureOn(false);
        clearMeasure();
        clearArea();
      } else clearArea();
      return next;
    });
  }, [clearArea, clearMeasure]);

  // 지도 클릭 → 측정 모드면 점 추가 / 거리뷰 모드면 로드뷰 열기
  useEffect(() => {
    const map = mapRef.current;
    const { naver } = window;
    if (!mapReady || !map || !naver) return;
    const listener = naver.maps.Event.addListener(map, 'click', (e: { coord: { lat: () => number; lng: () => number } }) => {
      const lat = e.coord.lat();
      const lon = e.coord.lng();
      if (measureOn) addMeasurePoint(lat, lon);
      else if (areaOn) addAreaPoint(lat, lon);
      else if (streetOn) {
        setPanoMsg(null);
        setPano({ lat, lon, label: '거리뷰' });
      }
    });
    return () => naver.maps.Event.removeListener(listener);
  }, [mapReady, measureOn, areaOn, streetOn, addMeasurePoint, addAreaPoint]);

  useEffect(() => {
    if (!streetOn) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      clearStreet();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [streetOn, clearStreet]);

  // 거리 측정 중에는 다음 클릭 예정 지점까지 임시 선/거리를 계속 표시한다.
  useEffect(() => {
    const map = mapRef.current;
    const { naver } = window;
    if (!mapReady || !measureOn || !map || !naver) return;
    const listener = naver.maps.Event.addListener(map, 'mousemove', (e: { coord: { lat: () => number; lng: () => number } }) => {
      if (measurePointsRef.current.length === 0) return;
      const previewPoint = { lat: e.coord.lat(), lon: e.coord.lng() };
      measurePreviewPointRef.current = previewPoint;
      updateMeasureGeometry(previewPoint);
    });
    return () => naver.maps.Event.removeListener(listener);
  }, [mapReady, measureOn, updateMeasureGeometry]);

  useEffect(() => {
    const map = mapRef.current;
    const { naver } = window;
    if (!mapReady || !measureOn || !map || !naver) return;
    const listener = naver.maps.Event.addListener(map, 'rightclick', (e: { coord: { lat: () => number; lng: () => number } }) => {
      finishMeasure({ lat: e.coord.lat(), lon: e.coord.lng() });
    });
    return () => naver.maps.Event.removeListener(listener);
  }, [mapReady, measureOn, finishMeasure]);

  useEffect(() => {
    if (!measureOn) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      finishMeasure();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [measureOn, finishMeasure]);

  useEffect(() => {
    const el = mapWrapRef.current;
    if (!measureOn || !el) return;
    const moveHint = (e: MouseEvent) => {
      if (measurePointsRef.current.length < 1) return;
      setMeasureHintPos(computeHintPos(el, e));
    };
    const preventContextMenu = (e: MouseEvent) => {
      if (measurePointsRef.current.length >= 1) e.preventDefault();
    };
    el.addEventListener('mousemove', moveHint, true);
    el.addEventListener('contextmenu', preventContextMenu, true);
    return () => {
      el.removeEventListener('mousemove', moveHint, true);
      el.removeEventListener('contextmenu', preventContextMenu, true);
    };
  }, [measureOn]);

  // 면적 측정 중에는 다음 클릭 예정 지점까지 임시 선/면을 계속 표시한다.
  useEffect(() => {
    const map = mapRef.current;
    const { naver } = window;
    if (!mapReady || !areaOn || !map || !naver) return;
    const listener = naver.maps.Event.addListener(map, 'mousemove', (e: { coord: { lat: () => number; lng: () => number } }) => {
      if (areaPointsRef.current.length === 0) return;
      const previewPoint = { lat: e.coord.lat(), lon: e.coord.lng() };
      areaPreviewPointRef.current = previewPoint;
      updateAreaGeometry(previewPoint);
    });
    return () => naver.maps.Event.removeListener(listener);
  }, [mapReady, areaOn, updateAreaGeometry]);

  useEffect(() => {
    const map = mapRef.current;
    const { naver } = window;
    if (!mapReady || !areaOn || !map || !naver) return;
    const listener = naver.maps.Event.addListener(map, 'rightclick', (e: { coord: { lat: () => number; lng: () => number } }) => {
      finishArea({ lat: e.coord.lat(), lon: e.coord.lng() });
    });
    return () => naver.maps.Event.removeListener(listener);
  }, [mapReady, areaOn, finishArea]);

  useEffect(() => {
    if (!areaOn) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      finishArea();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [areaOn, finishArea]);

  useEffect(() => {
    const el = mapWrapRef.current;
    if (!areaOn || !el) return;
    const moveHint = (e: MouseEvent) => {
      if (areaPointsRef.current.length < 2) return;
      setAreaHintPos(computeHintPos(el, e));
    };
    const preventContextMenu = (e: MouseEvent) => {
      if (areaPointsRef.current.length >= 2) e.preventDefault();
    };
    el.addEventListener('mousemove', moveHint, true);
    el.addEventListener('contextmenu', preventContextMenu, true);
    return () => {
      el.removeEventListener('mousemove', moveHint, true);
      el.removeEventListener('contextmenu', preventContextMenu, true);
    };
  }, [areaOn]);

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
      pov: { pan: 0, tilt: 0, fov: 100 }, // 최대 광각(fov 상한 100) → 가장 넓은 거리 보기
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
      <div ref={mapWrapRef} style={{ position: 'relative', width: '100%', height: '100dvh' }}>
        <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />

        {/* 거리뷰 모드: 지도 정중앙에 페그맨(사람) + 원형 링 (네이버 스타일). 지도 이동해도 항상 중앙 고정. */}
        {streetOn && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 12,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* 바깥 원형(라운드) */}
            <div
              style={{
                position: 'absolute',
                width: 92,
                height: 92,
                borderRadius: '50%',
                background: 'rgba(27,100,218,.12)',
                border: '2px solid rgba(27,100,218,.55)',
                boxShadow: '0 2px 10px rgba(0,0,0,.18)',
              }}
            />
            {/* 흰색 배지 + 파란 사람 아이콘 */}
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: '#fff',
                border: '2px solid #1B64DA',
                boxShadow: '0 2px 6px rgba(0,0,0,.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="6" r="2.6" fill="#1B64DA" />
                <path
                  d="M12 9c-2.2 0-4 1.5-4 3.6V16h1.7v4.4a1 1 0 0 0 1 1h2.6a1 1 0 0 0 1-1V16H16v-3.4C16 10.5 14.2 9 12 9Z"
                  fill="#1B64DA"
                />
              </svg>
            </div>
          </div>
        )}

        {measureOn && measurePointCount >= 1 && measureHintPos && (
          <div
            style={{
              position: 'absolute',
              left: measureHintPos.x,
              top: measureHintPos.y,
              width: AREA_HINT_WIDTH,
              boxSizing: 'border-box',
              background: '#fff',
              border: '1px solid #DDE2E7',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,.18)',
              padding: '10px 12px',
              zIndex: 30,
              pointerEvents: 'none',
              fontSize: 12,
              color: '#191F28',
              lineHeight: 1.55,
            }}
          >
            {measureDist > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', alignItems: 'center', marginBottom: 8, fontWeight: 700 }}>
                <span>총거리</span>
                <span style={{ color: '#1B64DA' }}>{fmtDist(measureDist)}</span>
              </div>
            )}
            <div>마우스 오른쪽 버튼 혹은</div>
            <div>ESC키를 눌러 마침</div>
          </div>
        )}

        {areaOn && areaPointCount >= 2 && areaHintPos && (
          <div
            style={{
              position: 'absolute',
              left: areaHintPos.x,
              top: areaHintPos.y,
              width: AREA_HINT_WIDTH,
              boxSizing: 'border-box',
              background: '#fff',
              border: '1px solid #DDE2E7',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,.18)',
              padding: '10px 12px',
              zIndex: 30,
              pointerEvents: 'none',
              fontSize: 12,
              color: '#191F28',
              lineHeight: 1.55,
            }}
          >
            {areaSize > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', alignItems: 'center', marginBottom: 8, fontWeight: 700 }}>
                <span>총면적</span>
                <span style={{ color: '#1B64DA' }}>{fmtArea(areaSize)}</span>
              </div>
            )}
            <div>마우스 오른쪽 버튼 혹은</div>
            <div>ESC키를 눌러 마침</div>
          </div>
        )}

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

        {/* 우측 세로 툴바 (거리뷰 / 면적 측정 / 거리 측정) */}
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
              { key: 'area', icon: ICON_AREA, label: '면적 측정', active: areaOn, onClick: toggleArea },
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
        {(measureOn || measureFinished || areaOn || areaFinished) && (
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
              {measureOn &&
                (measureDist > 0 ? <b>총 {fmtDist(measureDist)}</b> : '지도를 클릭해 거리를 측정하세요')}
              {measureFinished && <b>총 {fmtDist(measureDist)}</b>}
              {areaOn &&
                (areaSize > 0 ? <b>면적 {fmtArea(areaSize)}</b> : '지도를 클릭해 면적 경계를 지정하세요')}
              {areaFinished && <b>면적 {fmtArea(areaSize)}</b>}
            </span>
            <button
              onClick={measureOn || measureFinished ? clearMeasure : clearArea}
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
