// 마커를 key 기준으로 diff(재사용)한다.
// 기존 동작은 매 idle(pan/zoom)마다 화면의 모든 마커를 setMap(null)로 지우고 전부 새로 생성했다.
// 여기서는 화면에 "남는" 마커는 그대로 두고, "떠난" 것만 제거, "새로 들어온" 것만 생성한다 →
// pan 시 대부분 겹치는 마커의 생성/파괴 비용을 없앤다. 화면 결과(위치·아이콘·클릭·InfoWindow)는 동일.
//
// key 규칙(호출부 책임): 모드 접두사(`i:`/`c:`) + 렌더·동작에 영향 주는 모든 필드를 포함한다.
// 즉 "같은 key ⟺ 위치·아이콘·타이틀·클릭동작이 완전히 동일". 데이터가 바뀌면 key가 달라져 새
// 마커로 교체되므로(= 기존의 매번 재생성과 동등) stale 마커/리스너가 남지 않는다.
// 같은 key가 specs에 중복되면(완전히 동일한 대상) 첫 1개만 만든다 — orphan 마커 누수 방지.

export type MarkerSpec = {
  key: string;
  lat: number;
  lon: number;
  content: string; // icon HTML
  anchor: [number, number];
  title: string;
  onClick: (marker: any) => void;
};

export function syncMarkers(
  naver: any,
  map: any,
  pool: Map<string, any>,
  specs: MarkerSpec[],
): Map<string, any> {
  const next = new Map<string, any>();
  const desiredKeys = new Set(specs.map((s) => s.key));

  // 화면에서 떠난 마커 제거(지도에서 내리고 풀에서 드롭 → GC).
  for (const [key, marker] of pool) {
    if (!desiredKeys.has(key)) marker.setMap(null);
  }

  // 남는 건 그대로 재사용, 새 것만 생성.
  for (const s of specs) {
    // 같은 key 중복(완전 동일 대상)은 첫 1개만 — 둘째를 만들면 풀에 안 잡혀 지도에 orphan으로 남는다.
    if (next.has(s.key)) continue;
    const existing = pool.get(s.key);
    if (existing) {
      next.set(s.key, existing);
      continue;
    }
    const marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(s.lat, s.lon),
      map,
      title: s.title,
      icon: { content: s.content, anchor: new naver.maps.Point(s.anchor[0], s.anchor[1]) },
    });
    naver.maps.Event.addListener(marker, 'click', () => s.onClick(marker));
    next.set(s.key, marker);
  }

  return next;
}
