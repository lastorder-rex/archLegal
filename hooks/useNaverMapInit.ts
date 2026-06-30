'use client';

import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import { ICON_CHECK, ICON_COPY } from '@/components/violation-map/map-constants';
import type { Pano } from '@/components/violation-map/types';

// 지도 1회 초기화: Script onReady 게이팅 + naver SDK 4중 가드 + InfoWindow + window.__viol* 전역
// + 이동(idle) 시 250ms 디바운스 로드. ⚠️ 가드(`!scriptReady||!mapElRef.current||mapRef.current||
// !window.naver`)와 단일 idle 등록은 동작 유지에 필수 — 지도 생성을 더 일찍/밖으로 옮기지 말 것.
// refs는 부모가 만들어 넘긴다(loadMarkers 등이 같은 mapRef를 읽어야 하므로 순환 의존 회피).
export function useNaverMapInit({
  scriptReady,
  refreshView,
  onOpenRoadview,
  mapElRef,
  mapRef,
  infoRef,
}: {
  scriptReady: boolean;
  refreshView: () => void;
  onOpenRoadview: (p: Pano) => void;
  mapElRef: RefObject<HTMLDivElement>;
  mapRef: MutableRefObject<any>;
  infoRef: MutableRefObject<any>;
}): { mapReady: boolean } {
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapReady, setMapReady] = useState(false);

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
      onOpenRoadview({ lat, lon, label });
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
  }, [scriptReady, refreshView, onOpenRoadview, mapElRef, mapRef, infoRef]);

  return { mapReady };
}
