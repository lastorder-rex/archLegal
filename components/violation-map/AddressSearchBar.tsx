import { ICON_X } from './map-constants';
import type { SearchResult } from './types';

// 상단 중앙 주소 검색창(폼/입력/지우기/검색 + 후보 목록 + 결과없음). 표시 전담, 상태는 부모.
export function AddressSearchBar({
  searchQ,
  searching,
  searchDone,
  results,
  onQueryChange,
  onSubmit,
  onClear,
  onSelect,
}: {
  searchQ: string;
  searching: boolean;
  searchDone: boolean;
  results: SearchResult[];
  onQueryChange: (v: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onSelect: (it: SearchResult) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(92vw, 380px)',
        zIndex: 20,
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,.15)',
          padding: '8px 10px 8px 14px',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7684" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={searchQ}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="주소 검색 (예: 구로구 경인로 445)"
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#191F28', background: 'transparent' }}
        />
        {searchQ && (
          <button
            type="button"
            onClick={onClear}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#6B7684' }}
            title="지우기"
            dangerouslySetInnerHTML={{ __html: ICON_X }}
          />
        )}
        <button
          type="submit"
          style={{ flexShrink: 0, background: '#1B64DA', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          {searching ? '검색중' : '검색'}
        </button>
      </form>

      {results.length > 0 && (
        <div
          style={{
            marginTop: 6,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,.15)',
            overflow: 'hidden',
            maxHeight: '50vh',
            overflowY: 'auto',
          }}
        >
          {results.map((it, i) => (
            <button
              key={`${it.address}-${i}`}
              onClick={() => onSelect(it)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderTop: i === 0 ? 'none' : '1px solid #F2F4F6',
                padding: '11px 14px',
                fontSize: 13.5,
                color: '#191F28',
                cursor: 'pointer',
              }}
            >
              {it.address}
            </button>
          ))}
        </div>
      )}
      {searchDone && !searching && searchQ.trim().length >= 2 && results.length === 0 && (
        <div style={{ marginTop: 6, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,.15)', padding: '11px 14px', fontSize: 13, color: '#6B7684' }}>
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
