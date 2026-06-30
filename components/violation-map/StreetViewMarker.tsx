// 거리뷰 모드: 지도 정중앙에 페그맨(사람) + 원형 링 (네이버 스타일). 지도 이동해도 항상 중앙 고정.
// streetOn일 때만 부모가 렌더한다. 순수 표시(이벤트 없음).
export function StreetViewMarker() {
  return (
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
  );
}
