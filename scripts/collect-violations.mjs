#!/usr/bin/env node
/**
 * 위반건축물 수집 → Supabase 적재 스크립트 (서울 전 자치구 자동)
 *
 * 1) VWorld 시군구 경계(lt_c_adsigg)에서 대상 시도(기본 서울=11)의 구 목록+bbox를 자동 조회
 * 2) 구별로 VWorld WFS lt_c_bldginfo(viol_bd_yn=1)를 쿼드트리 수집(MAXFEATURES 1000 상한 시 4분할)
 * 3) 법정동명은 VWorld 역지오코딩으로 동별 1회 해석
 * 4) public.violation_buildings 테이블에 upsert(pnu 기준 → 멱등, 재실행 안전)
 *
 * 특징: 구 단위 순차 처리, 한 구 실패해도 다음 구 계속, 이미 적재된 구는 건너뜀(이어가기).
 * 옵션(환경변수):
 *   SIDO=11        대상 시도 코드 접두사 (기본 서울). 전국 확장 시 변경.
 *   FORCE=1        이미 데이터 있는 구도 다시 수집
 *   ONLY=11680,..  특정 구 코드만 (쉼표구분)
 * 사용법: node scripts/collect-violations.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n');
const getEnv = (k) => (env.find((l) => l.startsWith(`${k}=`)) || '').slice(k.length + 1).trim();
const KEY = getEnv('VWORLD_API_KEY');
const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
if (!KEY) throw new Error('VWORLD_API_KEY 미설정');
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase 환경변수 미설정');

const SIDO = process.env.SIDO || '11'; // 서울
const FORCE = process.env.FORCE === '1';
const ONLY = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const MAX = 1000;
const USE = {
  '01000': '단독주택', '02000': '공동주택', '03000': '제1종근린생활시설', '04000': '제2종근린생활시설',
  '05000': '문화및집회시설', '06000': '종교시설', '07000': '판매시설', '08000': '운수시설',
  '09000': '의료시설', '10000': '교육연구시설', '14000': '업무시설', '16000': '숙박시설', '17000': '위락시설',
};
const RESIDENTIAL = new Set(['01000', '02000', '03000', '04000']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TICK = () => sleep(120);

async function vworldWfs(params) {
  const u = new URL('https://api.vworld.kr/req/wfs');
  Object.entries({ SERVICE: 'WFS', REQUEST: 'GetFeature', VERSION: '1.1.0', KEY, DOMAIN: 'localhost:3002', SRSNAME: 'EPSG:4326', ...params })
    .forEach(([k, v]) => u.searchParams.set(k, v));
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(u.toString(), { headers: { 'User-Agent': 'archLegal/1.0' } });
      const xml = await res.text();
      if (xml.includes('ServiceException') || xml.includes('ExceptionReport')) throw new Error(xml.slice(0, 160));
      return xml;
    } catch (err) {
      if (attempt === 2) throw err;
      await sleep(600 * (attempt + 1));
    }
  }
}

// 대상 시도의 구 목록 + bbox 조회
async function getDistricts() {
  const xml = await vworldWfs({
    TYPENAME: 'lt_c_adsigg', MAXFEATURES: '500', PROPERTYNAME: 'sig_cd,sig_kor_nm',
    FILTER: `<Filter><PropertyIsLike wildCard="*" singleChar="?" escapeChar="\\"><PropertyName>sig_cd</PropertyName><Literal>${SIDO}*</Literal></PropertyIsLike></Filter>`,
  });
  return xml.split(/<sop:lt_c_adsigg[ >]/).slice(1).map((s) => {
    const cd = (s.match(/sig_cd>([^<]*)/) || [])[1];
    const nm = (s.match(/sig_kor_nm>([^<]*)/) || [])[1];
    const c = ((s.match(/<gml:coordinates[^>]*>([^<]+)/) || [])[1] || '').trim().split(' ').map((p) => p.split(',').map(Number));
    if (!cd || c.length < 2) return null;
    return { cd, nm, bbox: { minLon: c[0][0], minLat: c[0][1], maxLon: c[1][0], maxLat: c[1][1] } };
  }).filter(Boolean);
}

function parseBuildings(xml) {
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

async function reverseGeocode(lat, lon) {
  const u = new URL('https://api.vworld.kr/req/address');
  Object.entries({ service: 'address', request: 'getAddress', version: '2.0', crs: 'epsg:4326', point: `${lon},${lat}`, format: 'json', type: 'PARCEL', key: KEY })
    .forEach(([k, v]) => u.searchParams.set(k, v));
  try {
    const j = await (await fetch(u.toString(), { headers: { 'User-Agent': 'archLegal/1.0' } })).json();
    const st = j?.response?.result?.[0]?.structure;
    return st ? { sigungu: st.level2 || '', bjdong: st.level4L || '' } : null;
  } catch {
    return null;
  }
}

// 한 구 수집
async function collectDistrict(d) {
  const all = new Map();
  let tiles = 0;
  let splits = 0;
  async function quad(b, depth = 0) {
    const xml = await vworldWfs({ TYPENAME: 'lt_c_bldginfo', MAXFEATURES: String(MAX), BBOX: `${b.minLat},${b.minLon},${b.maxLat},${b.maxLon}` });
    await TICK();
    const feats = parseBuildings(xml);
    tiles++;
    if (feats.length >= MAX && depth < 9) {
      splits++;
      const mLat = (b.minLat + b.maxLat) / 2;
      const mLon = (b.minLon + b.maxLon) / 2;
      for (const q of [
        { minLat: b.minLat, minLon: b.minLon, maxLat: mLat, maxLon: mLon },
        { minLat: b.minLat, minLon: mLon, maxLat: mLat, maxLon: b.maxLon },
        { minLat: mLat, minLon: b.minLon, maxLat: b.maxLat, maxLon: mLon },
        { minLat: mLat, minLon: mLon, maxLat: b.maxLat, maxLon: b.maxLon },
      ]) await quad(q, depth + 1);
      return;
    }
    for (const f of feats) if (f.pnu) all.set(f.pnu, f);
    process.stdout.write(`\r    타일 ${tiles}(분할 ${splits}) · 누적 ${all.size}   `);
  }
  await quad(d.bbox);
  process.stdout.write('\n');

  const viols = [...all.values()].filter((b) => b.viol === '1' && b.lat != null && b.pnu.startsWith(d.cd));

  // 법정동명 해석 (동별 1회)
  const dongNames = new Map();
  for (const v of viols) {
    const bjCd = v.pnu.slice(5, 10);
    if (dongNames.has(bjCd)) continue;
    const geo = await reverseGeocode(v.lat, v.lon);
    await TICK();
    dongNames.set(bjCd, geo || { sigungu: d.nm, bjdong: '' });
  }

  const records = viols.map((v) => {
    const bjdongCd = v.pnu.slice(5, 10);
    const san = v.pnu[10] === '2' ? '산 ' : '';
    const bun = parseInt(v.pnu.slice(11, 15), 10) || null;
    const ji = parseInt(v.pnu.slice(15, 19), 10) || null;
    const nm = dongNames.get(bjdongCd) || {};
    const sigungu_nm = nm.sigungu || d.nm;
    const bjdong_nm = nm.bjdong || '';
    const jibun = bun ? `${sigungu_nm} ${bjdong_nm} ${san}${bun}${ji ? `-${ji}` : ''}`.replace(/\s+/g, ' ').trim() : null;
    return {
      pnu: v.pnu, sigungu_cd: v.pnu.slice(0, 5), bjdong_cd: bjdongCd,
      sigungu_nm, bjdong_nm, bun, ji, jibun,
      bld_nm: v.name || null, use_code: v.use, use_name: USE[v.use] || v.use,
      residential: RESIDENTIAL.has(v.use), floors: v.floors ? Number(v.floors) : null,
      useapr_day: v.useaprDay || null, lat: v.lat, lon: v.lon, collected_at: new Date().toISOString(),
    };
  });

  for (let i = 0; i < records.length; i += 500) {
    const { error } = await supabase.from('violation_buildings').upsert(records.slice(i, i + 500), { onConflict: 'pnu' });
    if (error) throw new Error(`upsert 실패: ${error.message}`);
  }
  return records.length;
}

async function main() {
  console.log(`대상 시도: ${SIDO}  (FORCE=${FORCE ? 'on' : 'off'}${ONLY.length ? `, ONLY=${ONLY.join(',')}` : ''})`);
  let districts = await getDistricts();
  if (ONLY.length) districts = districts.filter((d) => ONLY.includes(d.cd));
  console.log(`구 ${districts.length}개\n`);

  let grand = 0;
  const summary = [];
  for (const d of districts) {
    try {
      if (!FORCE) {
        const { count } = await supabase.from('violation_buildings').select('pnu', { count: 'exact', head: true }).eq('sigungu_cd', d.cd);
        if (count && count > 0) {
          console.log(`■ ${d.nm}(${d.cd}) — 이미 ${count}건, 건너뜀`);
          summary.push(`${d.nm}: ${count}(skip)`);
          continue;
        }
      }
      console.log(`■ ${d.nm}(${d.cd}) 수집…`);
      const n = await collectDistrict(d);
      console.log(`  ✅ ${d.nm} 적재 ${n}건`);
      summary.push(`${d.nm}: ${n}`);
      grand += n;
    } catch (e) {
      console.error(`  ❌ ${d.nm} 실패: ${e.message} → 다음 구 계속`);
      summary.push(`${d.nm}: 실패`);
    }
  }
  console.log(`\n=== 완료 ===\n${summary.join('\n')}\n신규 적재 합계: ${grand}건`);
}

main().catch((e) => { console.error(e); process.exit(1); });
