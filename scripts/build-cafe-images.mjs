import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'marketing-content/generated-images/cafe');
const BASE_DIR = path.join(OUT_DIR, 'base');
const SIZE = 1024;

const posts = [
  [1, 'roof', '옥탑방, 양성화 가능할까?', '옥탑방도 위반건축물 양성화가 가능할까요?'],
  [2, 'roof', '옥탑방, 양성화 가능할까?', '오래전에 만든 옥상 창고도 양성화 대상이 될 수 있나요?'],
  [3, 'balcony', '발코니 확장 확인 포인트', '베란다를 확장했는데 위반건축물로 볼 수 있나요?'],
  [4, 'balcony', '발코니 확장 확인 포인트', '테라스에 지붕을 설치한 경우도 문제가 되나요?'],
  [5, 'law', '특별조치법 핵심 요건', '다세대주택 한 세대만 위반인 경우도 양성화가 가능한가요?'],
  [6, 'register', '건축물대장 어디를 볼까?', '건축물대장에 위반 표시가 없으면 괜찮은 건가요?'],
  [7, 'fine', '이행강제금, 먼저 계산', '이미 이행강제금을 낸 건물도 양성화 신청이 가능한가요?'],
  [8, 'register', '건축물대장 어디를 볼까?', '작은 면적의 무단증축도 위반건축물에 해당하나요?'],
  [9, 'register', '건축물대장 어디를 볼까?', '사용승인 후 내부 구조를 바꾼 경우도 문제가 되나요?'],
  [10, 'law', '특별조치법 핵심 요건', '오래된 위반건축물은 시간이 지나면 괜찮아지나요?'],
  [11, 'fine', '이행강제금, 먼저 계산', '이행강제금은 한 번만 내면 끝인가요?'],
  [12, 'fine', '이행강제금, 먼저 계산', '이행강제금은 어떻게 계산되나요?'],
  [13, 'fine', '이행강제금, 먼저 계산', '이행강제금이 매년 반복 부과될 수 있나요?'],
  [14, 'fine', '이행강제금, 먼저 계산', '무단증축 면적이 작아도 이행강제금이 나오나요?'],
  [15, 'contract', '계약 전 위반건축물 확인', '이행강제금을 내고 있으면 매매가 가능한가요?'],
  [16, 'fine', '이행강제금, 먼저 계산', '이행강제금 부과 전 양성화 상담을 받아야 하나요?'],
  [17, 'fine', '이행강제금, 먼저 계산', '이행강제금 계산기만으로 정확한 금액을 알 수 있나요?'],
  [18, 'roof', '옥탑방, 양성화 가능할까?', '옥상에 방을 만든 경우, 어떤 점을 확인해야 할까요?'],
  [19, 'roof', '옥탑방, 양성화 가능할까?', '옥상 창고를 설치한 경우 양성화 가능성은 어떻게 보나요?'],
  [20, 'parking', '주차장 창고 사용, 괜찮을까?', '주차장을 창고로 사용 중인 경우 문제가 될 수 있나요?'],
  [21, 'commercial-residential', '근생 원룸 사용 확인', '근린생활시설을 주거용 원룸처럼 쓰는 경우는 어떤가요?'],
  [22, 'balcony', '발코니 확장 확인 포인트', '발코니를 실내처럼 확장한 경우 확인할 점'],
  [23, 'parking', '주차장 창고 사용, 괜찮을까?', '1층 필로티나 주차장 일부를 막아 사용한 경우'],
  [24, 'balcony', '발코니 확장 확인 포인트', '마당이나 테라스에 고정식 지붕을 설치한 경우'],
  [25, 'register', '건축물대장 어디를 볼까?', '건물 뒤편에 무단으로 공간을 늘린 경우'],
  [26, 'contract', '계약 전 위반건축물 확인', '위반건축물 표시가 있으면 매매가 어려운가요?'],
  [27, 'contract', '계약 전 위반건축물 확인', '전세 계약 전 위반건축물 여부를 꼭 확인해야 하나요?'],
  [28, 'contract', '계약 전 위반건축물 확인', '위반건축물은 대출이나 보증보험에 문제가 될 수 있나요?'],
  [29, 'contract', '계약 전 위반건축물 확인', '매수 후 위반 사실을 알게 되면 어떻게 해야 하나요?'],
  [30, 'register', '건축물대장 어디를 볼까?', '건축물대장 확인만으로 위반 여부를 알 수 있나요?'],
];

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function wrapKorean(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function textLines(lines, x, y, size, weight, fill, gap = 1.22) {
  return lines
    .map((line, index) => (
      `<text x="${x}" y="${y + index * size * gap}" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(line)}</text>`
    ))
    .join('');
}

function overlaySvg({ headline, subtitle }) {
  const headlineLines = wrapKorean(headline, 13);
  const subtitleLines = wrapKorean(subtitle, 22);

  return Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#06152f" stop-opacity="0.90"/>
      <stop offset="72%" stop-color="#06152f" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#06152f" stop-opacity="0.10"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#00102a" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#shade)"/>
  <rect x="56" y="68" width="588" height="372" rx="34" fill="#fffaf0" fill-opacity="0.94" filter="url(#shadow)"/>
  <rect x="88" y="104" width="132" height="38" rx="19" fill="#c49a43"/>
  <text x="154" y="130" text-anchor="middle" font-family="Apple SD Gothic Neo, Noto Sans CJK KR, Pretendard, Arial, sans-serif" font-size="20" font-weight="800" fill="#ffffff">양성화.com</text>
  <g font-family="Apple SD Gothic Neo, Noto Sans CJK KR, Pretendard, Arial, sans-serif" letter-spacing="-0.2">
    ${textLines(headlineLines, 88, 213, 58, 900, '#081a38', 1.1)}
    ${textLines(subtitleLines, 90, 355, 22, 700, '#5a6472', 1.35)}
  </g>
  <rect x="88" y="882" width="204" height="42" rx="21" fill="#081a38" fill-opacity="0.88"/>
  <text x="190" y="910" text-anchor="middle" font-family="Apple SD Gothic Neo, Noto Sans CJK KR, Pretendard, Arial, sans-serif" font-size="20" font-weight="800" fill="#fffaf0">위반건축물 상담</text>
</svg>`);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const [number, type, headline, subtitle] of posts) {
    const source = path.join(BASE_DIR, `${type}.png`);
    const output = path.join(OUT_DIR, `cafe_${String(number).padStart(3, '0')}_main.png`);

    await sharp(source)
      .resize(SIZE, SIZE, { fit: 'cover' })
      .composite([{ input: overlaySvg({ headline, subtitle }), top: 0, left: 0 }])
      .png({ compressionLevel: 9, palette: false })
      .toFile(output);
  }

  console.log(`Generated ${posts.length} cafe images in ${path.relative(ROOT, OUT_DIR)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
