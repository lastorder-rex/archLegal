#!/usr/bin/env node
/**
 * 위반건축물 지도용 수집 스크립트 (PoC→배치)
 *
 * VWorld WFS lt_c_bldginfo 레이어를 BBOX로 조회해 위반건축물(viol_bd_yn=1)을
 * 좌표·용도와 함께 수집한다. MAXFEATURES 상한(1000)에 잘리지 않도록, 타일이
 * 1000건을 꽉 채우면 4분할(쿼드트리)로 재귀 조회한다.
 *
 * 사용법: node scripts/collect-violations.mjs
 * 출력:   lib/violation-map/oryudong.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// --- VWorld 키 로드 (.env.local 직접 파싱) ---
const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
const KEY = (env.split('\n').find((l) => /^VWORLD_API_KEY=/.test(l)) || '').split('=')[1]?.trim();
if (!KEY) {
  console.error('VWORLD_API_KEY 미설정');
  process.exit(1);
}

const MAX = 1000; // VWorld MAXFEATURES 상한
const TARGET = { name: '구로구 오류동', minLat: 37.488, minLon: 126.832, maxLat: 37.507, maxLon: 126.864 };

// usability(건축물 용도 대분류) 코드 → 한글
const USE = {
  '01000': '단독주택',
  '02000': '공동주택',
  '03000': '제1종근린생활시설',
  '04000': '제2종근린생활시설',
  '05000': '문화및집회시설',
  '06000': '종교시설',
  '07000': '판매시설',
  '08000': '운수시설',
  '09000': '의료시설',
  '10000': '교육연구시설',
  '14000': '업무시설',
  '16000': '숙박시설',
  '17000': '위락시설',
};
// 주거 관련(단독·공동·근린=주택전환 후보)만 마커 대상
const RESIDENTIAL = new Set(['01000', '02000', '03000', '04000']);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchTile(b) {
  const u = new URL('https://api.vworld.kr/req/wfs');
  const params = {
    SERVICE: 'WFS',
    REQUEST: 'GetFeature',
    TYPENAME: 'lt_c_bldginfo',
    VERSION: '1.1.0',
    KEY,
    DOMAIN: 'localhost:3002',
    MAXFEATURES: String(MAX),
    SRSNAME: 'EPSG:4326',
    BBOX: `${b.minLat},${b.minLon},${b.maxLat},${b.maxLon}`,
  };
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(u.toString(), { headers: { 'User-Agent': 'archLegal/1.0' } });
      const xml = await res.text();
      if (xml.includes('ServiceException') || xml.includes('ExceptionReport')) {
        throw new Error(xml.slice(0, 200));
      }
      return xml;
    } catch (err) {
      if (attempt === 2) throw err;
      await sleep(500 * (attempt + 1));
    }
  }
}

function parseFeatures(xml) {
  return xml
    .split(/<sop:lt_c_bldginfo[ >]/)
    .slice(1)
    .map((s) => {
      const g = (s.match(/<gml:coordinates[^>]*>([^<]+)/) || [])[1] || '';
      const pts = g.trim().split(' ').map((p) => p.split(',').map(Number)).filter((p) => p.length >= 2);
      const ctr = pts.length
        ? {
            lon: +(pts.reduce((a, p) => a + p[0], 0) / pts.length).toFixed(6),
            lat: +(pts.reduce((a, p) => a + p[1], 0) / pts.length).toFixed(6),
          }
        : null;
      return {
        pnu: (s.match(/<sop:pnu>([^<]*)/) || [])[1] || '',
        viol: (s.match(/viol_bd_yn>\s*([^<\s]*)/) || [])[1] || '',
        use: (s.match(/<sop:usability>([^<]*)/) || [])[1] || '',
        name: ((s.match(/<sop:bld_nm>([^<]*)/) || [])[1] || '').trim(),
        dong: ((s.match(/<sop:dong_nm>([^<]*)/) || [])[1] || '').trim(),
        floors: (s.match(/<sop:grnd_flr>([^<]*)/) || [])[1] || '',
        useaprDay: (s.match(/<sop:useapr_day>([^<]*)/) || [])[1] || '',
        lat: ctr?.lat,
        lon: ctr?.lon,
      };
    });
}

const all = new Map(); // pnu → feature (중복제거)
let tileCount = 0;
let splitCount = 0;

// 1000 꽉 차면 4분할 재귀
async function collect(b, depth = 0) {
  const xml = await fetchTile(b);
  const feats = parseFeatures(xml);
  tileCount++;
  if (feats.length >= MAX && depth < 8) {
    splitCount++;
    const mLat = (b.minLat + b.maxLat) / 2;
    const mLon = (b.minLon + b.maxLon) / 2;
    const quads = [
      { minLat: b.minLat, minLon: b.minLon, maxLat: mLat, maxLon: mLon },
      { minLat: b.minLat, minLon: mLon, maxLat: mLat, maxLon: b.maxLon },
      { minLat: mLat, minLon: b.minLon, maxLat: b.maxLat, maxLon: mLon },
      { minLat: mLat, minLon: mLon, maxLat: b.maxLat, maxLon: b.maxLon },
    ];
    for (const q of quads) await collect(q, depth + 1);
    return;
  }
  for (const f of feats) if (f.pnu) all.set(f.pnu, f);
  process.stdout.write(`\r타일 ${tileCount} (분할 ${splitCount}) · 누적건물 ${all.size}   `);
}

console.log(`수집 시작: ${TARGET.name}`);
await collect(TARGET);
console.log('');

const buildings = [...all.values()];
const violations = buildings
  .filter((b) => b.viol === '1' && b.lat != null)
  .map((b) => ({
    pnu: b.pnu,
    name: b.name || null,
    dong: b.dong || null,
    useCode: b.use,
    useName: USE[b.use] || b.use,
    residential: RESIDENTIAL.has(b.use),
    floors: b.floors ? Number(b.floors) : null,
    useaprDay: b.useaprDay || null,
    lat: b.lat,
    lon: b.lon,
  }));
const residential = violations.filter((v) => v.residential);

const useDist = violations.reduce((a, v) => {
  a[v.useName] = (a[v.useName] || 0) + 1;
  return a;
}, {});

const out = {
  region: TARGET.name,
  bbox: TARGET,
  collectedAt: new Date().toISOString(),
  source: 'VWorld WFS lt_c_bldginfo (viol_bd_yn=1)',
  counts: {
    buildings: buildings.length,
    violations: violations.length,
    residentialViolations: residential.length,
  },
  useDistribution: useDist,
  items: violations,
};

const outDir = path.join(ROOT, 'lib', 'violation-map');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'oryudong.json');
fs.writeFileSync(outFile, JSON.stringify(out, null, 2), 'utf8');

console.log('\n=== 수집 완료 ===');
console.log(`건물(중복제거): ${buildings.length}`);
console.log(`위반건축물: ${violations.length} (주거 ${residential.length})`);
console.log('용도분포:', useDist);
console.log(`저장: ${path.relative(ROOT, outFile)}`);
