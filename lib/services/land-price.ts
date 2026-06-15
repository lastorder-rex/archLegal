const USER_AGENT = 'archLegal/1.0';

export type AddressCode = {
  sigunguCd: string;
  bjdongCd: string;
  platGbCd: string;
  bun: string;
  ji: string;
  sigunguName?: string;
  bjdongName?: string;
};

export type LandPriceData = {
  pnu: string;
  standardYear: number | null;
  standardMonth: number | null;
  landPriceKrwPerM2: number | null;
  address: string | null;
  raw: any;
};

export type FetchLandPriceResult =
  | { ok: true; data: LandPriceData }
  | { ok: false; reason: string };

function parseInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildPnu(code: Pick<AddressCode, 'sigunguCd' | 'bjdongCd' | 'platGbCd' | 'bun' | 'ji'>) {
  const pnuLandType = code.platGbCd === '1' ? '2' : '1';
  return `${code.sigunguCd}${code.bjdongCd}${pnuLandType}${code.bun}${code.ji}`;
}

async function fetchJson<T>(url: URL, timeoutMs = 7000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchLandPrice(pnu: string): Promise<FetchLandPriceResult> {
  const apiKey = process.env.VWORLD_API_KEY;
  if (!apiKey) {
    console.error('[VWorld] VWORLD_API_KEY is not set');
    return { ok: false, reason: 'API 키 미설정 (VWORLD_API_KEY)' };
  }

  const domain = process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3002';
  const resolvedDomain = domain.replace(/^https?:\/\//, '');
  const url = new URL('https://api.vworld.kr/req/data');
  url.searchParams.set('service', 'data');
  url.searchParams.set('request', 'GetFeature');
  url.searchParams.set('data', 'LP_PA_CBND_BUBUN');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('domain', resolvedDomain);
  url.searchParams.set('attrFilter', `pnu:=:${pnu}`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('size', '10');
  url.searchParams.set('page', '1');

  let data: any;
  try {
    data = await fetchJson<any>(url);
  } catch (err) {
    const reason = `VWorld 요청 실패 (domain=${resolvedDomain}, ${err instanceof Error ? err.message : err})`;
    console.error('[VWorld] fetch failed', { resolvedDomain, pnu, err });
    return { ok: false, reason };
  }

  if (data?.response?.status !== 'OK') {
    const reason = `VWorld 응답 오류 (status=${data?.response?.status}, domain=${resolvedDomain})`;
    console.error('[VWorld] API error', { status: data?.response?.status, resolvedDomain });
    return { ok: false, reason };
  }

  const feature = data?.response?.result?.featureCollection?.features?.[0];
  if (!feature?.properties?.jiga) {
    console.error('[VWorld] No jiga found for PNU', pnu);
    return { ok: false, reason: `해당 필지 공시지가 없음 (PNU=${pnu})` };
  }

  return {
    ok: true,
    data: {
      pnu,
      standardYear: parseInteger(feature.properties.gosi_year),
      standardMonth: parseInteger(feature.properties.gosi_month),
      landPriceKrwPerM2: parseInteger(feature.properties.jiga),
      address: feature.properties.addr || null,
      raw: feature.properties
    }
  };
}
