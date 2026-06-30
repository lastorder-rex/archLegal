'use client';

import { useEffect, useRef, useState } from 'react';
import { ICON_EXPAND, ICON_SHRINK } from './map-constants';
import type { Pano } from './types';

// 로드뷰(거리뷰) 전체화면 오버레이 + 동기화 미니맵.
// 부모는 pano가 있을 때만 렌더한다(open=mount, close=unmount). 파노라마/미니맵 생성·정리는
// 이 컴포넌트가 소유. ⚠️ z-index(파노라마 1000 / 미니맵 9999), 리사이즈 타이머(300/60ms),
// destroy try-catch, getPosition?.() 옵셔널 체이닝은 동작 유지에 필요 — 변경 금지.
export function RoadviewOverlay({ pano, onClose }: { pano: Pano; onClose: () => void }) {
  const panoElRef = useRef<HTMLDivElement>(null);
  const panoRef = useRef<any>(null);
  const miniElRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<any>(null);
  const miniMarkerRef = useRef<any>(null);
  const [miniExpanded, setMiniExpanded] = useState(false);
  const [panoMsg, setPanoMsg] = useState<string | null>(null);

  // 좌표의 거리뷰(Panorama) 생성 + 미니맵(현재 위치, 로드뷰 이동 시 동기화).
  useEffect(() => {
    if (!window.naver || !panoElRef.current) return;
    const { naver } = window;

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

    return () => {
      if (panoRef.current) {
        try { panoRef.current.destroy(); } catch { /* noop */ }
        panoRef.current = null;
      }
      miniMapRef.current = null;
      miniMarkerRef.current = null;
    };
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

  return (
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
          onClick={onClose}
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
  );
}
