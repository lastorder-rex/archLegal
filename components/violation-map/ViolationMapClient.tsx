'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

// 위반건축물 지도 (네이버지도 + 마커).
// 데이터: GET /api/violation/map (사전 수집 캐시). 좌표를 이미 갖고 있어
// Geocoding 불필요 → NCP Maps Client ID(브라우저용)만 있으면 된다.

type ViolationItem = {
  pnu: string;
  name: string | null;
  useCode: string;
  useName: string;
  residential: boolean;
  floors: number | null;
  useaprDay: string | null;
  lat: number;
  lon: number;
};

type ApiResponse = {
  ok: boolean;
  region: string;
  collectedAt: string;
  counts: { buildings: number; violations: number; residentialViolations: number };
  useDistribution: Record<string, number>;
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

declare global {
  interface Window {
    naver: any;
  }
}

const fmtDay = (d: string | null) =>
  d && d.length === 8 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}` : '-';

export function ViolationMapClient() {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const infoRef = useRef<any>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    fetch('/api/violation/map?region=oryudong&residential=1')
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        if (!d.ok) throw new Error('데이터 조회 실패');
        setData(d);
      })
      .catch((e) => setError(e.message || '데이터를 불러오지 못했습니다.'));
  }, []);

  // 지도 + 마커 렌더
  const renderMap = useCallback(() => {
    if (!scriptReady || !data || !mapElRef.current || !window.naver) return;
    const { naver } = window;

    if (!mapRef.current) {
      mapRef.current = new naver.maps.Map(mapElRef.current, {
        center: new naver.maps.LatLng(37.4975, 126.848),
        zoom: 15,
        zoomControl: true,
        zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT },
      });
      infoRef.current = new naver.maps.InfoWindow({ borderWidth: 0, disableAnchor: false, pixelOffset: new naver.maps.Point(0, -4) });
    }
    const map = mapRef.current;

    data.items.forEach((it) => {
      const color = colorOf(it.useName);
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(it.lat, it.lon),
        map,
        title: it.name || it.useName,
        icon: {
          content: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
          anchor: new naver.maps.Point(7, 7),
        },
      });
      naver.maps.Event.addListener(marker, 'click', () => {
        const html = `
          <div style="padding:14px 16px;min-width:220px;font-family:inherit">
            <div style="font-size:11px;font-weight:800;color:#E5484D;margin-bottom:6px">위반건축물</div>
            <div style="font-size:16px;font-weight:800;color:#191F28;margin-bottom:8px">${it.name || '(건물명 없음)'}</div>
            <div style="font-size:13px;color:#6B7684;line-height:1.7">
              용도: <b style="color:#191F28">${it.useName}</b><br/>
              ${it.floors ? `지상 ${it.floors}층 · ` : ''}사용승인 ${fmtDay(it.useaprDay)}
            </div>
            <div style="display:flex;gap:8px;margin-top:12px">
              <a href="/enforcement-fine" style="flex:1;text-align:center;padding:9px 0;background:#1B64DA;color:#fff;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none">이행강제금 계산</a>
              <a href="/check" style="flex:1;text-align:center;padding:9px 0;background:#F7F8FA;color:#191F28;border:1px solid #E5E8EB;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none">자가진단</a>
            </div>
          </div>`;
        infoRef.current.setContent(html);
        infoRef.current.open(map, marker);
      });
    });
  }, [scriptReady, data]);

  useEffect(() => {
    renderMap();
  }, [renderMap]);

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
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}`}
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
            {data ? `${data.region} · 주거 위반 ${data.total}건` : '불러오는 중…'}
          </div>
          {data && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
              {Object.entries(USE_COLOR).map(([name, color]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7684' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                  {name.replace('생활시설', '')}
                </div>
              ))}
            </div>
          )}
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
      </div>
    </>
  );
}
