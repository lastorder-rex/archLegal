'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNaverMapInit } from '@/hooks/useNaverMapInit';
import { useMeasurementMode } from '@/hooks/useMeasurementMode';
import { colorOf, ICON_PIN } from './map-constants';
import { buildViolationInfoWindowHtml } from './buildInfoWindowHtml';
import { MapStatusCard } from './MapStatusCard';
import { StreetViewMarker } from './StreetViewMarker';
import { AddressSearchBar } from './AddressSearchBar';
import { MapToolbar } from './MapToolbar';
import { MeasurementDisplay } from './MeasurementDisplay';
import { RoadviewOverlay } from './RoadviewOverlay';
import { syncMarkers, type MarkerSpec } from './syncMarkers';
import type { ApiResponse, Cluster, Pano, SearchResult, ViewMode, ViolationItem } from './types';

// 위반건축물 지도 (네이버지도 + 마커). 데이터: GET /api/violation/map (Supabase).
// 지도를 움직일 때마다 화면 영역(bbox)으로 조회해 보이는 마커만 렌더 → 데이터가 늘어도 가볍다.
// 이 컴포넌트는 오케스트레이터: 지도 init/측정/거리뷰는 훅·하위 컴포넌트가 담당한다.

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

export function ViolationMapClient() {
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const infoRef = useRef<any>(null);
  // 마커 풀(key→naver.maps.Marker). pan/zoom 시 전부 재생성하지 않고 델타만 처리.
  const markerPoolRef = useRef<Map<string, any>>(new Map());
  const searchMarkerRef = useRef<any>(null);
  const streetLayerRef = useRef<any>(null);

  const [scriptReady, setScriptReady] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pano, setPano] = useState<Pano | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('marker');
  const [searchQ, setSearchQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [streetOn, setStreetOn] = useState(false);
  const [measureOn, setMeasureOn] = useState(false);
  const [areaOn, setAreaOn] = useState(false);

  // 마커 클릭 시 InfoWindow 열기
  function openInfo(map: any, marker: any, it: ViolationItem) {
    infoRef.current.setContent(buildViolationInfoWindowHtml(it));
    infoRef.current.open(map, marker);
  }

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
        const specs: MarkerSpec[] = d.items.map((it) => ({
          // key = 렌더·InfoWindow에 쓰이는 모든 필드의 충돌불가 인코딩(JSON) → 데이터가 바뀌면 새
          // 마커로 교체(stale 방지). JSON.stringify라 필드에 어떤 문자가 와도 구분자 충돌이 없다.
          key: `i:${JSON.stringify([it.lat, it.lon, it.useName, it.name, it.jibun, it.floors, it.useaprDay])}`,
          lat: it.lat,
          lon: it.lon,
          title: it.name || it.useName,
          content: `<div style="width:14px;height:14px;border-radius:50%;background:${colorOf(it.useName)};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
          anchor: [7, 7],
          onClick: (marker) => openInfo(map, marker, it),
        }));
        markerPoolRef.current = syncMarkers(naver, map, markerPoolRef.current, specs);
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
      .then((d: { ok: boolean; clusters: Cluster[] }) => {
        if (!d.ok) throw new Error('집계 조회 실패');
        const b = map.getBounds();
        const sw = b.getSW();
        const ne = b.getNE();
        const inView = d.clusters.filter((c) => c.lat >= sw.lat() && c.lat <= ne.lat() && c.lon >= sw.lng() && c.lon <= ne.lng());
        const specs: MarkerSpec[] = inView.map((c) => {
          const size = c.count >= 1000 ? 58 : c.count >= 300 ? 50 : c.count >= 80 ? 42 : 34;
          return {
            // count(버블 숫자·크기)·중심좌표(morph 목표)가 바뀌면 새 마커로 교체(stale 방지).
            // JSON 인코딩이라 이름에 어떤 문자가 와도 구분자 충돌이 없다.
            key: `c:${JSON.stringify([c.name, c.count, c.lat, c.lon])}`,
            lat: c.lat,
            lon: c.lon,
            title: `${c.name} ${c.count}건`,
            content: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:rgba(27,100,218,.92);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);color:#fff;font-size:${size >= 50 ? 15 : 13}px;font-weight:800;font-family:inherit;cursor:pointer">${c.count}</div>`,
            anchor: [size / 2, size / 2],
            onClick: () => {
              map.morph(new naver.maps.LatLng(c.lat, c.lon), Math.min(map.getZoom() + 3, 16));
            },
          };
        });
        markerPoolRef.current = syncMarkers(naver, map, markerPoolRef.current, specs);
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
      .then((d: { ok: boolean; items: SearchResult[] }) => {
        setResults(d.ok ? d.items : []);
      })
      .catch(() => setResults([]))
      .finally(() => {
        setSearching(false);
        setSearchDone(true);
      });
  }, []);

  // 검색 후보 선택 → 지도 이동 + 핀 표시
  const goToResult = useCallback((it: SearchResult) => {
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
      setPano({ lat: it.lat, lon: it.lon, label: it.address });
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQ('');
    setResults([]);
    setSearchDone(false);
    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null);
      searchMarkerRef.current = null;
    }
  }, []);

  // 지도 1회 초기화 + 이동(idle) 시 디바운스 로드
  const { mapReady } = useNaverMapInit({ scriptReady, refreshView, onOpenRoadview: setPano, mapElRef, mapRef, infoRef });

  // 거리/면적 측정 (공통 훅, 설정만 다름)
  const {
    pointCount: measurePointCount,
    finished: measureFinished,
    value: measureDist,
    hintPos: measureHintPos,
    clear: clearMeasure,
    addPoint: addMeasurePoint,
  } = useMeasurementMode({ enabled: measureOn, mapReady, color: '#1B64DA', minPoints: 2, isPolygon: false, mapRef, mapWrapRef, setEnabled: setMeasureOn });

  const {
    pointCount: areaPointCount,
    finished: areaFinished,
    value: areaSize,
    hintPos: areaHintPos,
    clear: clearArea,
    addPoint: addAreaPoint,
  } = useMeasurementMode({ enabled: areaOn, mapReady, color: '#16A34A', minPoints: 3, isPolygon: true, mapRef, mapWrapRef, setEnabled: setAreaOn });

  // === 우측 툴바 기능 ===
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

  // 측정 토글 (켜면 형제 모드 끄고 초기화, 끄면 초기화)
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
  }, [clearMeasure, clearArea]);

  const closeRoadview = useCallback(() => setPano(null), []);

  // 지도 클릭 → 측정 모드면 점 추가 / 거리뷰 모드면 로드뷰 열기 (우선순위 measure > area > street)
  useEffect(() => {
    const map = mapRef.current;
    const { naver } = window;
    if (!mapReady || !map || !naver) return;
    const listener = naver.maps.Event.addListener(map, 'click', (e: { coord: { lat: () => number; lng: () => number } }) => {
      const lat = e.coord.lat();
      const lon = e.coord.lng();
      if (measureOn) addMeasurePoint(lat, lon);
      else if (areaOn) addAreaPoint(lat, lon);
      else if (streetOn) setPano({ lat, lon, label: '거리뷰' });
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

        {/* 거리뷰 모드: 지도 정중앙에 페그맨(사람) + 원형 링. 지도 이동해도 항상 중앙 고정. */}
        {streetOn && <StreetViewMarker />}

        {/* 측정/면적 힌트박스 + 하단 결과바 */}
        <MeasurementDisplay
          measureOn={measureOn}
          measureFinished={measureFinished}
          measureDist={measureDist}
          measurePointCount={measurePointCount}
          measureHintPos={measureHintPos}
          areaOn={areaOn}
          areaFinished={areaFinished}
          areaSize={areaSize}
          areaPointCount={areaPointCount}
          areaHintPos={areaHintPos}
          onClearMeasure={clearMeasure}
          onClearArea={clearArea}
        />

        {/* 주소 검색창 (상단 중앙) */}
        <AddressSearchBar
          searchQ={searchQ}
          searching={searching}
          searchDone={searchDone}
          results={results}
          onQueryChange={(v) => {
            setSearchQ(v);
            setSearchDone(false);
          }}
          onSubmit={() => doSearch(searchQ)}
          onClear={clearSearch}
          onSelect={goToResult}
        />

        {/* 상단 정보 카드 */}
        <MapStatusCard loading={loading} count={count} viewMode={viewMode} />

        {/* 우측 세로 툴바 (거리뷰 / 면적 측정 / 거리 측정) */}
        <MapToolbar
          streetOn={streetOn}
          areaOn={areaOn}
          measureOn={measureOn}
          onToggleStreet={toggleStreet}
          onToggleArea={toggleArea}
          onToggleMeasure={toggleMeasure}
        />

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
        {pano && <RoadviewOverlay pano={pano} onClose={closeRoadview} />}
      </div>
    </>
  );
}
