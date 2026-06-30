// 위반건축물 지도 기능 공용 타입.

// 네이버 지도 SDK 전역 + InfoWindow HTML onclick이 호출하는 window.__viol* 핸들러.
declare global {
  interface Window {
    naver: any;
    __violCopyAddr?: (el: HTMLElement, text: string) => void;
    __violRoadview?: (lat: number, lon: number, label: string) => void;
    __violCloseInfo?: () => void;
  }
}

export type ViolationItem = {
  name: string | null;
  jibun: string | null;
  useName: string;
  floors: number | null;
  useaprDay: string | null;
  lat: number;
  lon: number;
};

export type ApiResponse = {
  ok: boolean;
  total: number;
  items: ViolationItem[];
};

export type Cluster = { name: string; count: number; lat: number; lon: number };

export type ViewMode = 'marker' | 'sigungu' | 'bjdong';

export type Pano = { lat: number; lon: number; label: string };

export type SearchResult = { address: string; lat: number; lon: number };
