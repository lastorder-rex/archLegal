import type { CSSProperties } from 'react';
import { AREA_HINT_WIDTH, fmtArea, fmtDist } from '@/lib/utils/map-geometry';

type HintPos = { x: number; y: number } | null;

// 커서 옆 힌트박스의 정적 스타일(측정/면적 공통). left/top만 per-instance.
const hintBoxBaseStyle: CSSProperties = {
  position: 'absolute',
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
};

const hintRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '70px 1fr',
  alignItems: 'center',
  marginBottom: 8,
  fontWeight: 700,
};

// 측정/면적 모드의 커서 힌트박스(상단) + 결과 안내바(하단)를 한 번에 렌더.
// 전부 position:absolute라 DOM 순서는 레이아웃에 영향 없음.
export function MeasurementDisplay({
  measureOn,
  measureFinished,
  measureDist,
  measurePointCount,
  measureHintPos,
  areaOn,
  areaFinished,
  areaSize,
  areaPointCount,
  areaHintPos,
  onClearMeasure,
  onClearArea,
}: {
  measureOn: boolean;
  measureFinished: boolean;
  measureDist: number;
  measurePointCount: number;
  measureHintPos: HintPos;
  areaOn: boolean;
  areaFinished: boolean;
  areaSize: number;
  areaPointCount: number;
  areaHintPos: HintPos;
  onClearMeasure: () => void;
  onClearArea: () => void;
}) {
  return (
    <>
      {measureOn && measurePointCount >= 1 && measureHintPos && (
        <div style={{ ...hintBoxBaseStyle, left: measureHintPos.x, top: measureHintPos.y }}>
          {measureDist > 0 && (
            <div style={hintRowStyle}>
              <span>총거리</span>
              <span style={{ color: '#1B64DA' }}>{fmtDist(measureDist)}</span>
            </div>
          )}
          <div>마우스 오른쪽 버튼 혹은</div>
          <div>ESC키를 눌러 마침</div>
        </div>
      )}

      {areaOn && areaPointCount >= 2 && areaHintPos && (
        <div style={{ ...hintBoxBaseStyle, left: areaHintPos.x, top: areaHintPos.y }}>
          {areaSize > 0 && (
            <div style={hintRowStyle}>
              <span>총면적</span>
              <span style={{ color: '#1B64DA' }}>{fmtArea(areaSize)}</span>
            </div>
          )}
          <div>마우스 오른쪽 버튼 혹은</div>
          <div>ESC키를 눌러 마침</div>
        </div>
      )}

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
            {measureOn && (measureDist > 0 ? <b>총 {fmtDist(measureDist)}</b> : '지도를 클릭해 거리를 측정하세요')}
            {measureFinished && <b>총 {fmtDist(measureDist)}</b>}
            {areaOn && (areaSize > 0 ? <b>면적 {fmtArea(areaSize)}</b> : '지도를 클릭해 면적 경계를 지정하세요')}
            {areaFinished && <b>면적 {fmtArea(areaSize)}</b>}
          </span>
          <button
            onClick={measureOn || measureFinished ? onClearMeasure : onClearArea}
            style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            초기화
          </button>
        </div>
      )}
    </>
  );
}
