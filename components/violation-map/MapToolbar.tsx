import type { CSSProperties } from 'react';
import { ICON_AREA, ICON_RULER, ICON_STREET } from './map-constants';

// 우측 세로 툴바 버튼 스타일(파일스코프 → 렌더마다 객체 재생성 방지).
const toolbarButtonStyle = (active: boolean): CSSProperties => ({
  width: 44,
  height: 44,
  borderRadius: 10,
  border: '1px solid #E5E8EB',
  background: active ? '#1B64DA' : '#fff',
  color: active ? '#fff' : '#454C53',
  boxShadow: '0 2px 8px rgba(0,0,0,.12)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

// 우측 세로 툴바 (거리뷰 / 면적 측정 / 거리 측정).
export function MapToolbar({
  streetOn,
  areaOn,
  measureOn,
  onToggleStreet,
  onToggleArea,
  onToggleMeasure,
}: {
  streetOn: boolean;
  areaOn: boolean;
  measureOn: boolean;
  onToggleStreet: () => void;
  onToggleArea: () => void;
  onToggleMeasure: () => void;
}) {
  const buttons = [
    { key: 'street', icon: ICON_STREET, label: '거리뷰', active: streetOn, onClick: onToggleStreet },
    { key: 'area', icon: ICON_AREA, label: '면적 측정', active: areaOn, onClick: onToggleArea },
    { key: 'measure', icon: ICON_RULER, label: '거리 측정', active: measureOn, onClick: onToggleMeasure },
  ] as const;

  return (
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
      {buttons.map((b) => (
        <button
          key={b.key}
          onClick={b.onClick}
          title={b.label}
          aria-label={b.label}
          style={toolbarButtonStyle(b.active)}
          dangerouslySetInnerHTML={{ __html: b.icon }}
        />
      ))}
    </div>
  );
}
