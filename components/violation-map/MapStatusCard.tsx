import { USE_COLOR } from './map-constants';
import type { ViewMode } from './types';

// 좌상단 정보 카드(건수/뷰모드 라벨/범례/출처). 순수 표시.
export function MapStatusCard({
  loading,
  count,
  viewMode,
}: {
  loading: boolean;
  count: number | null;
  viewMode: ViewMode;
}) {
  return (
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
  );
}
