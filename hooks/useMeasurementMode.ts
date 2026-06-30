'use client';

import { useCallback, useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import { computeHintPos, polygonArea, totalDistance, type LatLon } from '@/lib/utils/map-geometry';
import { DUPLICATE_POINT_EPSILON } from '@/components/violation-map/map-constants';

type NaverCoordEvent = { coord: { lat: () => number; lng: () => number } };

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

// 거리/면적 측정의 공통 로직(점 추가·미리보기·마침·초기화 + 폴리라인/폴리곤 렌더 + 이벤트).
// 거리: minPoints=2, isPolygon=false(열린 선, 총거리). 면적: minPoints=3, isPolygon=true(닫힌
// 폴리곤 채움, 총면적). ⚠️ 이 비대칭(minPoints, 폴리곤 채움, 힌트 임계 minPoints-1)을 보존해야 한다.
export function useMeasurementMode({
  enabled,
  mapReady,
  color,
  minPoints,
  isPolygon,
  mapRef,
  mapWrapRef,
  setEnabled,
}: {
  enabled: boolean;
  mapReady: boolean;
  color: string;
  minPoints: number;
  isPolygon: boolean;
  mapRef: MutableRefObject<any>;
  mapWrapRef: RefObject<HTMLDivElement>;
  setEnabled: (v: boolean) => void;
}) {
  const pointsRef = useRef<LatLon[]>([]);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const previewPointRef = useRef<LatLon | null>(null);
  const [finished, setFinished] = useState(false);
  const [pointCount, setPointCount] = useState(0);
  const [value, setValue] = useState(0); // 거리(m) 또는 면적(㎡)
  const [hintPos, setHintPos] = useState<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    pointsRef.current = [];
    previewPointRef.current = null;
    setFinished(false);
    setPointCount(0);
    setValue(0);
    setHintPos(null);
  }, []);

  // 점들(+미리보기점)로 폴리라인을, 면적 모드면 닫힌 폴리곤 채움까지 갱신.
  const updateGeometry = useCallback((previewPoint?: LatLon) => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver) return;

    const points = previewPoint ? [...pointsRef.current, previewPoint] : pointsRef.current;
    const path = points.map((p) => new naver.maps.LatLng(p.lat, p.lon));
    // 면적은 외곽선을 닫고(첫 점 추가) 폴리곤을 채운다. 거리는 열린 선.
    const outlinePath = isPolygon && path.length >= 3 ? [...path, path[0]] : path;
    const strokeWeight = isPolygon ? 3 : 4;
    const strokeOpacity = isPolygon ? 0.95 : 0.9;

    if (outlinePath.length >= 2 && polylineRef.current) {
      polylineRef.current.setPath(outlinePath);
    } else if (outlinePath.length >= 2) {
      polylineRef.current = new naver.maps.Polyline({ path: outlinePath, strokeColor: color, strokeWeight, strokeOpacity, map });
    } else if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (isPolygon) {
      if (path.length >= 3) {
        if (polygonRef.current) {
          polygonRef.current.setPaths(path);
        } else {
          polygonRef.current = new naver.maps.Polygon({
            paths: path,
            map,
            strokeColor: color,
            strokeWeight: 0,
            strokeOpacity: 0,
            fillColor: color,
            fillOpacity: 0.18,
          });
        }
      } else if (polygonRef.current) {
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      }
    }

    setValue(isPolygon ? polygonArea(points) : totalDistance(points));
  }, [color, isPolygon, mapRef]);

  const addPoint = useCallback((lat: number, lon: number) => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver) return;
    pointsRef.current.push({ lat, lon });
    previewPointRef.current = null;
    setFinished(false);
    setPointCount(pointsRef.current.length);
    markersRef.current.push(dotMarker(naver, map, lat, lon, color));
    updateGeometry();
  }, [color, updateGeometry, mapRef]);

  const finish = useCallback((finalPoint?: LatLon) => {
    const map = mapRef.current;
    const { naver } = window;
    if (!map || !naver || pointsRef.current.length < minPoints - 1) return;

    const pointToCommit = finalPoint || previewPointRef.current;
    if (pointToCommit) {
      const last = pointsRef.current[pointsRef.current.length - 1];
      const duplicated = last && Math.abs(last.lat - pointToCommit.lat) < DUPLICATE_POINT_EPSILON && Math.abs(last.lon - pointToCommit.lon) < DUPLICATE_POINT_EPSILON;
      if (!duplicated) {
        pointsRef.current.push(pointToCommit);
        markersRef.current.push(dotMarker(naver, map, pointToCommit.lat, pointToCommit.lon, color));
      }
    }

    if (pointsRef.current.length < minPoints) return;
    previewPointRef.current = null;
    updateGeometry();
    setPointCount(pointsRef.current.length);
    setEnabled(false);
    setFinished(true);
    setHintPos(null);
  }, [color, minPoints, updateGeometry, setEnabled, mapRef]);

  // 측정 중에는 다음 클릭 예정 지점까지 임시 선/면을 계속 표시한다.
  useEffect(() => {
    const map = mapRef.current;
    const { naver } = window;
    if (!mapReady || !enabled || !map || !naver) return;
    const listener = naver.maps.Event.addListener(map, 'mousemove', (e: NaverCoordEvent) => {
      if (pointsRef.current.length === 0) return;
      const previewPoint = { lat: e.coord.lat(), lon: e.coord.lng() };
      previewPointRef.current = previewPoint;
      updateGeometry(previewPoint);
    });
    return () => naver.maps.Event.removeListener(listener);
  }, [mapReady, enabled, updateGeometry, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    const { naver } = window;
    if (!mapReady || !enabled || !map || !naver) return;
    const listener = naver.maps.Event.addListener(map, 'rightclick', (e: NaverCoordEvent) => {
      finish({ lat: e.coord.lat(), lon: e.coord.lng() });
    });
    return () => naver.maps.Event.removeListener(listener);
  }, [mapReady, enabled, finish, mapRef]);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      finish();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, finish]);

  // 커서 옆 힌트박스 위치. 임계(minPoints-1)부터 표시 + 우클릭 컨텍스트메뉴 차단.
  useEffect(() => {
    const el = mapWrapRef.current;
    if (!enabled || !el) return;
    const hintThreshold = minPoints - 1;
    const moveHint = (e: MouseEvent) => {
      if (pointsRef.current.length < hintThreshold) return;
      setHintPos(computeHintPos(el, e));
    };
    const preventContextMenu = (e: MouseEvent) => {
      if (pointsRef.current.length >= hintThreshold) e.preventDefault();
    };
    el.addEventListener('mousemove', moveHint, true);
    el.addEventListener('contextmenu', preventContextMenu, true);
    return () => {
      el.removeEventListener('mousemove', moveHint, true);
      el.removeEventListener('contextmenu', preventContextMenu, true);
    };
  }, [enabled, minPoints, mapWrapRef]);

  return { pointCount, finished, value, hintPos, clear, addPoint };
}
