#!/usr/bin/env node
/**
 * 위반건축물 수집 → Supabase 적재 스크립트
 *
 * VWorld WFS lt_c_bldginfo(viol_bd_yn=1)를 구(시군구) 단위 BBOX로 쿼드트리 수집
 * (MAXFEATURES 1000 상한 시 자동 4분할)하고, 법정동명은 VWorld 역지오코딩으로
 * 동별 1회씩 해석한 뒤, public.violation_buildings 테이블에 upsert(pnu 기준)한다.
 *
 * 서울→전국 확장: TARGETS 배열에 { sigunguCd, bbox }만 추가하면 된다.
 * 사용법: node scripts/collect-violations.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// --- env 로드 (.env.local 직접 파싱) ---
const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n');
const getEnv = (k) => (env.find((l) => l.startsWith(`${k}=`)) || '').slice(k.length + 1).trim();
const KEY = getEnv('VWORLD_API_KEY');
const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
if (!KEY) throw new Error('VWORLD_API_KEY 미설정');
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase 환경변수 미설정');

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// 수집 대상(구 단위). bbox는 구 경계를 덮는 사각형(겹쳐도 PNU로 필터하므로 무방).
const TARGETS = [
  { sigunguCd: '11530', name: '구로구', bbox: { minLat: 37.46, minLon: 126.78, maxLat: 37.52, maxLon: 126.90 } },
];

const MAX = 1000; // VWorld MAXFEATURES 상한
const USE = {
  '01000': '단독주택', '02000': '공동주택', '03000': '제1종근린생활시설', '04000': '제2종근린생활시설',
  '05000': '문화및집회시설', '06000': '종교시설', '07000': '판매시설', '08000': '운수시설',
  '09000': '의료시설', '10000': '교육연구시설', '14000': '업무시설', '16000': '숙박시설', '17000': '위락시설',
};
const RESIDENTIAL = new Set(['01000', '02000', '03000', '04000']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchTile(b) {
  const u = new URL('https://api.vworld.kr/req/wfs');
  Object.entries({
    SERVICE: 'WFS', REQUEST: 'GetFeature', TYPENAME: 'lt_c_bldginfo', VERSION: '1.1.0',
    KEY, DOMAIN: 'localhost:3002', MAXFEATURES: String(MAX), SRSNAME: 'EPSG:4326',
    BBOX: `${b.minLat},${b.minLon},${b.maxLat},${b.maxLon}`,
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(u.toString(), { headers: { 'User-Agent': 'archLegal/1.0' } });
      const xml = await res.text();
      if (xml.includes('ServiceException') || xml.includes('ExceptionReport')) throw new Error(xml.slice(0, 160));
      return xml;
    } catch (err) {
      if (attempt === 2) throw err;
      await sleep(500 * (attempt + 1));
    }
  }
}

function parseFeatures(xml) {
  return xml.split(/<sop:lt_c_bldginfo[ >]/).slice(1).map((s) => {
    const g = (s.match(/<gml:coordinates[^>]*>([^<]+)/) || [])[1] || '';
    const pts = g.trim().split(' ').map((p) => p.split(',').map(Number)).filter((p) => p.length >= 2);
    const ctr = pts.length
      ? { lon: +(pts.reduce((a, p) => a + p[0], 0) / pts.length).toFixed(6), lat: +(pts.reduce((a, p) => a + p[1], 0) / pts.length).toFixed(6) }
      : null;
    return {
      pnu: (s.match(/<sop:pnu>([^<]*)/) || [])[1] || '',
      viol: (s.match(/viol_bd_yn>\s*([^<\s]*)/) || [])[1] || '',
      use: (s.match(/<sop:usability>([^<]*)/) || [])[1] || '',
      name: ((s.match(/<sop:bld_nm>([^<]*)/) || [])[1] || '').trim(),
      floors: (s.match(/<sop:grnd_flr>([^<]*)/) || [])[1] || '',
      useaprDay: (s.match(/<sop:useapr_day>([^<]*)/) || [])[1] || '',
      lat: ctr?.lat, lon: ctr?.lon,
    };
  });
}

// 법정동명 역지오코딩 (좌표 1점 → 법정동명). 동별 1회만 호출해 캐싱.
async function reverseGeocode(lat, lon) {
  const u = new URL('https://api.vworld.kr/req/address');
  Object.entries({
    service: 'address', request: 'getAddress', version: '2.0', crs: 'epsg:4326',
    point: `${lon},${lat}`, format: 'json', type: 'PARCEL', key: KEY,
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  try {
    const j = await (await fetch(u.toString(), { headers: { 'User-Agent': 'archLegal/1.0' } })).json();
    const st = j?.response?.result?.[0]?.structure;
    if (!st) return null;
    return { sigungu: st.level2 || '', bjdong: st.level4L || st.level4LC || '' };
  } catch {
    return null;
  }
}

const sleepQuad = () => sleep(120); // VWorld 호출 간 간격

async function main() {
  let grandTotal = 0;
  for (const target of TARGETS) {
    console.log(`\n=== ${target.name}(${target.sigunguCd}) 수집 ===`);
    const all = new Map();
    let tileCount = 0;
    let splitCount = 0;

    async function collect(b, depth = 0) {
      const xml = await fetchTile(b);
      await sleepQuad();
      const feats = parseFeatures(xml);
      tileCount++;
      if (feats.length >= MAX && depth < 9) {
        splitCount++;
        const mLat = (b.minLat + b.maxLat) / 2;
        const mLon = (b.minLon + b.maxLon) / 2;
        for (const q of [
          { minLat: b.minLat, minLon: b.minLon, maxLat: mLat, maxLon: mLon },
          { minLat: b.minLat, minLon: mLon, maxLat: mLat, maxLon: b.maxLon },
          { minLat: mLat, minLon: b.minLon, maxLat: b.maxLat, maxLon: mLon },
          { minLat: mLat, minLon: mLon, maxLat: b.maxLat, maxLon: b.maxLon },
        ]) await collect(q, depth + 1);
        return;
      }
      for (const f of feats) if (f.pnu) all.set(f.pnu, f);
      process.stdout.write(`\r  타일 ${tileCount}(분할 ${splitCount}) · 누적 ${all.size}   `);
    }
    await collect(target.bbox);
    console.log('');

    // 위반 + 해당 구만
    const viols = [...all.values()].filter(
      (b) => b.viol === '1' && b.lat != null && b.pnu.startsWith(target.sigunguCd)
    );
    console.log(`  위반건축물(구 필터 후): ${viols.length}`);

    // 법정동명 해석 (동별 1회)
    const dongNames = new Map(); // bjdongCd → { sigungu, bjdong }
    for (const v of viols) {
      const bjCd = v.pnu.slice(5, 10);
      if (dongNames.has(bjCd)) continue;
      const geo = await reverseGeocode(v.lat, v.lon);
      await sleepQuad();
      dongNames.set(bjCd, geo || { sigungu: target.name, bjdong: '' });
      process.stdout.write(`\r  법정동 해석 ${dongNames.size}개   `);
    }
    console.log('');

    // 레코드 구성
    const records = viols.map((v) => {
      const sigunguCd = v.pnu.slice(0, 5);
      const bjdongCd = v.pnu.slice(5, 10);
      const san = v.pnu[10] === '2' ? '산 ' : '';
      const bun = parseInt(v.pnu.slice(11, 15), 10) || null;
      const ji = parseInt(v.pnu.slice(15, 19), 10) || null;
      const nm = dongNames.get(bjdongCd) || {};
      const sigungu_nm = nm.sigungu || target.name;
      const bjdong_nm = nm.bjdong || '';
      const jibun = bun ? `${sigungu_nm} ${bjdong_nm} ${san}${bun}${ji ? `-${ji}` : ''}`.replace(/\s+/g, ' ').trim() : null;
      return {
        pnu: v.pnu, sigungu_cd: sigunguCd, bjdong_cd: bjdongCd,
        sigungu_nm, bjdong_nm, bun, ji, jibun,
        bld_nm: v.name || null, use_code: v.use, use_name: USE[v.use] || v.use,
        residential: RESIDENTIAL.has(v.use), floors: v.floors ? Number(v.floors) : null,
        useapr_day: v.useaprDay || null, lat: v.lat, lon: v.lon,
        collected_at: new Date().toISOString(),
      };
    });

    // upsert (배치 500)
    let upserted = 0;
    for (let i = 0; i < records.length; i += 500) {
      const batch = records.slice(i, i + 500);
      const { error } = await supabase.from('violation_buildings').upsert(batch, { onConflict: 'pnu' });
      if (error) {
        console.error('  upsert 실패:', error.message);
        process.exit(1);
      }
      upserted += batch.length;
      process.stdout.write(`\r  적재 ${upserted}/${records.length}   `);
    }
    console.log('');
    const dongDist = records.reduce((a, r) => { a[r.bjdong_nm || '?'] = (a[r.bjdong_nm || '?'] || 0) + 1; return a; }, {});
    console.log(`  ✅ ${target.name} 적재 완료: ${records.length}건`);
    console.log('  동별 분포:', dongDist);
    grandTotal += records.length;
  }
  console.log(`\n총 적재: ${grandTotal}건`);
}

main().catch((e) => { console.error(e); process.exit(1); });
