#!/usr/bin/env node
/**
 * 네이버 카페 글 1개 발행 스크립트 (반자동 · 안전장치: 1회 실행 = 1개 발행)
 *
 * 사용법:
 *   node scripts/publish-cafe.mjs 001            # 001번 미리보기(dry-run, 기본)
 *   node scripts/publish-cafe.mjs 001 --go       # 001번 실제 발행
 *   node scripts/publish-cafe.mjs --next         # 미발행 우선순위 다음 글 미리보기
 *   node scripts/publish-cafe.mjs --next --go    # 그 글 실제 발행
 *   옵션: --clubid <id> --menuid <id> --force --with-image --rich-html
 *
 * 준비:
 *   - node scripts/naver-cafe-token.mjs 로 .env.naver-cafe-token.json 발급
 *   - .env.local 에 NAVER_CAFE_CLUB_ID / NAVER_CAFE_MENU_ID (또는 --clubid/--menuid)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// 네이버 카페 API는 본문 파라미터를 내부에서 두 번 URL 디코딩한다.
// 따라서 클라이언트는 UTF-8로 "두 번" 퍼센트 인코딩해야 한글이 정상 저장된다.
// (한 번만 인코딩하면 내부 이중 디코딩으로 한글이 깨짐 — 실측 확인)
function encodeParam(str) {
  return encodeURIComponent(encodeURIComponent(str));
}

function encodeParamOnce(str) {
  return encodeURIComponent(str);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CAFE_DIR = path.join(ROOT, 'marketing-content', 'naver-cafe');
const IMG_PLAN = path.join(ROOT, 'marketing-content', 'image-plan', 'cafe_image_prompts.md');
const TOKEN_FILE = path.join(ROOT, '.env.naver-cafe-token.json');

// image-plan/cafe_image_prompts.md 에서 번호별 이미지 정보(파일명/문구/삽입위치) 조회
let _imgCache = null;
function imageInfo(num) {
  if (_imgCache === null) {
    _imgCache = {};
    if (fs.existsSync(IMG_PLAN)) {
      for (const b of fs.readFileSync(IMG_PLAN, 'utf8').split(/^##\s+/m).slice(1)) {
        const n = (b.match(/^(\d{3})\./) || [])[1];
        if (!n) continue;
        _imgCache[n] = {
          file: (b.match(/이미지 파일명:\s*(\S+)/) || [])[1] || '',
          thumb: ((b.match(/썸네일 문구:\s*(.+)/) || [])[1] || '').trim(),
          pos: ((b.match(/본문 삽입 위치:\s*(.+)/) || [])[1] || '').trim(),
        };
      }
    }
  }
  return _imgCache[num] || null;
}
const PUBLISHED_FILE = path.join(ROOT, 'marketing-content', '.cafe-published.json');

// .env.local 파싱 (collect-violations.mjs 방식 재사용)
const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n');
const getEnv = (k) => (env.find((l) => l.startsWith(`${k}=`)) || '').slice(k.length + 1).trim();

// ── 인자 파싱 ────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const GO = flag('--go');
const NEXT = flag('--next');
const FORCE = flag('--force');
const WITH_IMAGE = flag('--with-image');
const RICH_HTML = flag('--rich-html');
const CLUB_ID = opt('--clubid') || getEnv('NAVER_CAFE_CLUB_ID');
const MENU_ID = opt('--menuid') || getEnv('NAVER_CAFE_MENU_ID');
const GROUP = opt('--group'); // 특정 게시판(그룹)만 발행

// 게시판(메뉴) 매핑: 글번호 → 게시판. 각 글이 제 게시판으로 자동 발행됨.
const BOARDS = {
  '기본Q&A':      { menuid: 2, nums: ['005', '006', '008', '009', '010', '021', '025', '030'] },
  '옥상옥탑방':   { menuid: 3, nums: ['001', '002', '018', '019'] },
  '발코니테라스': { menuid: 4, nums: ['003', '004', '022', '024'] },
  '주차장필로티': { menuid: 5, nums: ['020', '023'] },
  '이행강제금':   { menuid: 6, nums: ['007', '011', '012', '013', '014', '015', '016', '017'] },
  '매매전세대출': { menuid: 7, nums: ['026', '027', '028', '029'] },
};
const NUM_TO_MENU = {};   // '007' -> 6
const NUM_TO_BOARD = {};  // '007' -> '이행강제금'
for (const [name, b] of Object.entries(BOARDS)) {
  for (const n of b.nums) { NUM_TO_MENU[n] = b.menuid; NUM_TO_BOARD[n] = name; }
}
// 글번호의 목적지 menuid (매핑 우선, 없으면 --menuid/env 기본값)
const menuFor = (num) => String(NUM_TO_MENU[num] ?? MENU_ID ?? '');
// 위치 인자(번호): 옵션값이 아닌 순수 번호 토큰
const OPT_VALUES = new Set([opt('--clubid'), opt('--menuid')].filter(Boolean));
const numArg = argv.find((a) => !a.startsWith('--') && !OPT_VALUES.has(a));

/**
 * --next 발행 우선순위 (marketing-content/README.md 3항 근거)
 * "이행강제금 → 양성화 가능성 → 옥탑방 → 주차장 용도변경 → 매매·전세 리스크 → 특조법 시행 일정"
 * 각 그룹의 파일 제목 키워드로 우선순위를 정하고, 어디에도 없으면 번호순으로 뒤에 배치.
 */
const PRIORITY_KEYWORDS = [
  ['이행강제금'],                              // 1) 이행강제금
  ['양성화', '무단증축', '위반건축물'],          // 2) 양성화 가능성
  ['옥탑방', '옥상'],                          // 3) 옥탑방/옥상
  ['주차장', '필로티', '용도변경', '근린생활'],   // 4) 주차장 용도변경
  ['매매', '전세', '매수', '대출', '보증보험'],   // 5) 매매·전세 리스크
  ['특별조치법', '특조법', '시행'],              // 6) 특조법 시행 일정
];

// ── 유틸 ─────────────────────────────────────────────────────
function listFiles() {
  return fs.readdirSync(CAFE_DIR)
    .filter((f) => /^\d{3}_.*\.md$/.test(f))
    .map((f) => ({ num: f.slice(0, 3), file: f }))
    .sort((a, b) => a.num.localeCompare(b.num));
}

function findFile(num) {
  const padded = String(num).padStart(3, '0');
  const hit = listFiles().find((x) => x.num === padded);
  return hit ? { num: padded, file: hit.file, full: path.join(CAFE_DIR, hit.file) } : null;
}

function priorityRank(file) {
  for (let i = 0; i < PRIORITY_KEYWORDS.length; i++) {
    if (PRIORITY_KEYWORDS[i].some((kw) => file.includes(kw))) return i;
  }
  return PRIORITY_KEYWORDS.length; // 미매칭은 맨 뒤
}

function loadPublished() {
  if (!fs.existsSync(PUBLISHED_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(PUBLISHED_FILE, 'utf8')); } catch { return []; }
}

function savePublished(list) {
  fs.writeFileSync(PUBLISHED_FILE, JSON.stringify(list, null, 2) + '\n', 'utf8');
}

function imagePathFor(num) {
  const img = imageInfo(num);
  if (!img?.file) return null;
  return path.join(ROOT, 'marketing-content', 'generated-images', 'cafe', img.file);
}

// ── MD 파싱 → subject / content(HTML) ────────────────────────
const DECOR = /^━+$/;                          // ━━━ 장식선
const SECTION_RE = /^\[([^\]]+)\]\s*$/;         // [섹션명]
// 본문에 포함할 섹션 (README 구성: [상황]~[댓글 유도 문구])
const BODY_SECTIONS = [
  '상황', '핵심 설명', '체크리스트', '예시 상황', '실무 체크',
  '주의', '상담 전 메모', '다음 단계', '댓글 유도 문구',
];
const LIST_SECTIONS = new Set(['체크리스트']);
const SITE_ORIGIN = 'https://www.archlegal.co.kr';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 카페 API 허용 태그: <b> <strong> <u> <mark> <p> <br> (style/color/table 은 거부됨)
// 밑줄 = 핵심 판단 기준 용어, 볼드 = 주제 키워드
const UNDERLINE_TERMS = [
  '건축물대장', '대피공간', '방화 기준', '바닥면적', '피난',
  '2023년 12월 31일', '특별조치법', '이행강제금',
];
const BOLD_TERMS = [
  '발코니', '베란다', '테라스', '위반건축물', '무단증축',
  '새시', '패널', '벽체', '현장 사진', '기존 평면도', '양성화',
];
// 카페 원고의 CTA 경로 → 실제 운영 라우트 매핑 (다르면 여기서 교정)
const PATH_MAP = { '/qna': '/qna3d' }; // /qna 라우트 없음 → 3D QnA(/qna3d)
function renderRichParagraph(text) {
  let safe = escapeHtml(text);
  safe = safe.replace(/양성화\.com(\/[A-Za-z0-9?=&._#%/-]*)?/g, (match, pathPart = '', offset, str) => {
    let p = pathPart || '/';
    if (PATH_MAP[p]) p = PATH_MAP[p];
    const url = `${SITE_ORIGIN}${p}`;
    // 네이버 자동링크가 뒤 한글 조사까지 링크에 포함시키므로, 조사가 붙으면 공백으로 경계 분리
    const nextChar = str[offset + match.length] || '';
    return /[가-힣]/.test(nextChar) ? `${url} ` : url;
  });
  for (const word of UNDERLINE_TERMS) {
    safe = safe.replaceAll(escapeHtml(word), `<u>${escapeHtml(word)}</u>`);
  }
  for (const word of BOLD_TERMS) {
    safe = safe.replaceAll(escapeHtml(word), `<b>${escapeHtml(word)}</b>`);
  }
  return safe;
}

function sectionTitle(name) {
  return `<p><b>[${escapeHtml(name)}]</b></p>`;
}

function parseArticle(full) {
  const lines = fs.readFileSync(full, 'utf8').split('\n');

  // subject: 첫 ━━━ 장식선 다음의 비어있지 않은 라인 (없으면 H1)
  let subject = '';
  for (let i = 0; i < lines.length; i++) {
    if (DECOR.test(lines[i].trim())) {
      for (let j = i + 1; j < lines.length; j++) {
        const t = lines[j].trim();
        if (DECOR.test(t)) break;
        if (t) { subject = t; break; }
      }
      if (subject) break;
    }
  }
  if (!subject) subject = (lines[0] || '').replace(/^#\s*/, '').trim();

  // 섹션 수집
  const sections = new Map(); // name -> string[] lines
  let cur = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const m = line.match(SECTION_RE);
    if (m) {
      cur = m[1].trim();
      if (!sections.has(cur)) sections.set(cur, []);
      continue;
    }
    if (cur == null) continue;
    if (DECOR.test(line.trim())) continue; // 장식선 제외
    sections.get(cur).push(line);
  }

  // 본문 HTML 조립
  const parts = [];

  // (1) 한 줄 요약 리드
  const summary = (sections.get('한 줄 요약') || []).map((l) => l.trim()).filter(Boolean);
  if (summary.length) {
    const line = escapeHtml(summary.join(' '));
    // 카페 API는 배경색(형광펜)을 렌더링하지 않음 → 볼드+밑줄로만 강조 가능
    parts.push(
      '<p><b>핵심 요약</b></p>',
      RICH_HTML ? `<p>💡 <b><u>${line}</u></b></p>` : `<p><b>${line}</b></p>`,
      '<br>',
    );
  }

  // (2) 이미지 삽입 위치 마커 (이미지 자동 첨부 시에는 본문 안내 제거)
  const num = (path.basename(full).match(/^(\d{3})/) || [])[1];
  const img = num && imageInfo(num);
  if (img && img.file && !WITH_IMAGE) {
    parts.push(`<p>┌───── 🖼 이미지 삽입 위치 (본문 상단) ─────</p>`);
    parts.push(`<p>│ 파일: ${escapeHtml(img.file)} · 비율 1:1${img.thumb ? ` · 문구 “${escapeHtml(img.thumb)}”` : ''}</p>`);
    parts.push(`<p>└ (이미지 넣은 뒤 이 안내 2줄은 지우세요)</p>`, '<br>');
  }

  for (const name of BODY_SECTIONS) {
    if (!sections.has(name)) continue;
    const body = sections.get(name).map((l) => l.trim()).filter(Boolean);
    if (!body.length) continue;
    // '댓글 유도 문구'는 운영 라벨이므로 제목 없이 문단만 노출
    if (name !== '댓글 유도 문구') parts.push(RICH_HTML ? sectionTitle(name) : `<b>${escapeHtml(name)}</b><br>`);
    if (LIST_SECTIONS.has(name)) {
      const items = body
        .filter((l) => l.startsWith('- '))
        .map((l) => l.slice(2).trim());
      const rest = body.filter((l) => !l.startsWith('- '));
      for (const p of rest) parts.push(`<p>${RICH_HTML ? renderRichParagraph(p) : escapeHtml(p)}</p>`);
      if (items.length) {
        if (RICH_HTML) {
          for (const item of items) parts.push(`<p>✓ ${renderRichParagraph(item)}</p>`);
        } else {
          parts.push(`<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`);
        }
      }
    } else {
      for (const p of body) {
        const prefix = RICH_HTML && name === '주의' ? '⚠ ' : '';
        parts.push(`<p>${prefix}${RICH_HTML ? renderRichParagraph(p) : escapeHtml(p)}</p>`);
      }
    }
    parts.push('<br>');
  }

  // 해시태그 (본문 끝에 넣으면 네이버 카페가 클릭 태그로 등록함)
  const kwLine = lines.find((l) => l.startsWith('추천 키워드:'));
  const keywords = kwLine ? kwLine.replace('추천 키워드:', '').split(',').map((s) => s.trim()).filter(Boolean) : [];
  const baseTags = ['위반건축물', '양성화', '특정건축물양성화'];
  const tags = [...new Set([...keywords, ...baseTags])]
    .map((t) => '#' + t.replace(/\s+/g, ''))   // 태그는 공백 제거 (#베란다 확장 → #베란다확장)
    .slice(0, 8);
  if (tags.length) parts.push('<br>', `<p>${tags.join(' ')}</p>`);

  const content = parts.join('\n');
  return { subject, content };
}

// ── 토큰 갱신 (refresh_token → access_token) ──────────────────
async function refreshAccessToken() {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error('토큰 파일이 없습니다. 먼저 실행: node scripts/naver-cafe-token.mjs');
  }
  const saved = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  if (!saved.refresh_token) {
    throw new Error('refresh_token 없음. 다시 발급: node scripts/naver-cafe-token.mjs');
  }
  const CLIENT_ID = getEnv('NAVER_CAFE_CLIENT_ID') || getEnv('NAVER_CLIENT_ID');
  const CLIENT_SECRET = getEnv('NAVER_CAFE_CLIENT_SECRET') || getEnv('NAVER_CLIENT_SECRET');
  const url =
    'https://nid.naver.com/oauth2.0/token?grant_type=refresh_token' +
    `&client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&client_secret=${encodeURIComponent(CLIENT_SECRET)}` +
    `&refresh_token=${encodeURIComponent(saved.refresh_token)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'archLegal-cafe/1.0' } });
  const json = await res.json().catch(() => ({}));
  if (!json.access_token) {
    const reason = json.error_description || json.error || JSON.stringify(json);
    throw new Error(`access_token 갱신 실패: ${reason}\n→ 먼저 실행: node scripts/naver-cafe-token.mjs`);
  }
  // 저장 파일 최신화 (refresh_token 은 응답에 없으면 유지)
  saved.access_token = json.access_token;
  if (json.refresh_token) saved.refresh_token = json.refresh_token;
  saved.refreshed_at = new Date().toISOString();
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(saved, null, 2) + '\n', 'utf8');
  return json.access_token;
}

// ── 발행 ─────────────────────────────────────────────────────
async function publish(accessToken, subject, content, menuid) {
  const url = `https://openapi.naver.com/v1/cafe/${CLUB_ID}/menu/${menuid}/articles`;
  // openyn=전체공개, searchopen=검색허용(SEO), replyyn=덧글허용
  const body = `subject=${encodeParam(subject)}&content=${encodeParam(content)}&openyn=true&searchopen=true&replyyn=true`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'archLegal-cafe/1.0',
    },
    body,
  });
  const json = await res.json().catch(() => ({}));
  const msg = json?.message?.result || json?.result || json;
  if (!res.ok || json?.message?.error || (msg && msg.errorCode)) {
    throw new Error(`발행 실패(HTTP ${res.status}): ${JSON.stringify(json)}`);
  }
  return {
    articleId: msg?.articleId ?? null,
    articleUrl: msg?.articleUrl ?? null,
    raw: json,
  };
}

async function publishWithImage(accessToken, subject, content, menuid, imagePath) {
  const url = `https://openapi.naver.com/v1/cafe/${CLUB_ID}/menu/${menuid}/articles`;
  const form = new FormData();
  // multipart 이미지 첨부 경로는 x-www-form-urlencoded 경로와 다르게 한 번만 디코딩된다.
  // raw UTF-8은 깨지고, 이중 인코딩은 %EB... 형태가 남으므로 1회 인코딩만 사용한다.
  form.append('subject', encodeParamOnce(subject));
  form.append('content', encodeParamOnce(content));
  const image = new Blob([fs.readFileSync(imagePath)], { type: 'image/png' });
  form.append('image', image, path.basename(imagePath));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'archLegal-cafe/1.0',
    },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  const msg = json?.message?.result || json?.result || json;
  if (!res.ok || json?.message?.error || (msg && msg.errorCode)) {
    throw new Error(`이미지 첨부 발행 실패(HTTP ${res.status}): ${JSON.stringify(json)}`);
  }
  return {
    articleId: msg?.articleId ?? null,
    articleUrl: msg?.articleUrl ?? null,
    raw: json,
  };
}

// ── 옵션: 반복 발행(--count) · 간격(--delay 초) ────────────────
const COUNT = Math.max(1, parseInt(opt('--count') || '1', 10) || 1);
const DELAY_SEC = Math.max(0, parseInt(opt('--delay') || '55', 10) || 0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 다음 대상 1개 선택 (--next: 우선순위·미발행 / 번호인자: 해당 글)
function pickTarget(publishedNums) {
  if (NEXT) {
    let pending = listFiles().filter((x) => !publishedNums.has(x.num));
    if (GROUP) {
      const g = BOARDS[GROUP];
      if (!g) { console.error(`❌ 알 수 없는 게시판: ${GROUP} (사용가능: ${Object.keys(BOARDS).join(', ')})`); process.exit(1); }
      pending = pending.filter((x) => g.nums.includes(x.num));
    }
    pending.sort((a, b) => priorityRank(a.file) - priorityRank(b.file) || a.num.localeCompare(b.num));
    if (!pending.length) return null;
    return { num: pending[0].num, file: pending[0].file, full: path.join(CAFE_DIR, pending[0].file) };
  }
  if (numArg) {
    const t = findFile(numArg);
    if (!t) { console.error(`❌ ${numArg} 번 글을 찾을 수 없습니다.`); process.exit(1); }
    return t;
  }
  console.error('사용법: node scripts/publish-cafe.mjs <번호> [--go] | --next [--go] [--count N]');
  process.exit(1);
}

// 대상 1개 발행 (published 배열/Set를 갱신)
async function publishOne(target, accessToken, published, publishedNums) {
  const { subject, content } = parseArticle(target.full);
  const menuid = menuFor(target.num);
  const boardName = NUM_TO_BOARD[target.num] || '(기본)';
  const imagePath = WITH_IMAGE ? imagePathFor(target.num) : null;
  console.log('\n════════ 미리보기 ════════');
  console.log(`파일   : ${target.file}`);
  console.log(`제목   : ${subject}`);
  console.log(`게시판 : ${boardName} (menuid=${menuid || '미설정'})   clubid: ${CLUB_ID || '(미설정)'}`);
  console.log(`이미지 : ${WITH_IMAGE ? (imagePath || '(이미지 정보 없음)') : '(첨부 안 함)'}`);
  console.log('──────── content(HTML) ────────');
  console.log(content);
  console.log('════════════════════════════\n');

  if (!GO) { console.log('ℹ️  dry-run 입니다. 실제 발행하려면 --go 를 붙이세요.'); return false; }

  if (!menuid) { console.error(`❌ ${target.num} 번의 게시판(menuid)을 정할 수 없습니다.`); return false; }

  if (publishedNums.has(target.num) && !FORCE) {
    console.error(`⚠️  ${target.num} 번은 이미 발행됨. 다시 발행하려면 --force. (건너뜀)`);
    return false;
  }

  if (WITH_IMAGE && (!imagePath || !fs.existsSync(imagePath))) {
    console.error(`❌ 이미지 파일을 찾을 수 없습니다: ${imagePath || '(없음)'}`);
    return false;
  }

  console.log(`📤 [${boardName}] 발행 중…`);
  const result = WITH_IMAGE
    ? await publishWithImage(accessToken, subject, content, menuid, imagePath)
    : await publish(accessToken, subject, content, menuid);
  console.log(`✅ 발행 완료  ${result.articleUrl}`);
  published.push({
    num: target.num, file: target.file,
    articleId: result.articleId, articleUrl: result.articleUrl,
    publishedAt: new Date().toISOString(),
    withImage: WITH_IMAGE,
    richHtml: RICH_HTML,
  });
  publishedNums.add(target.num);
  savePublished(published);
  return true;
}

// ── 메인 ─────────────────────────────────────────────────────
async function main() {
  const published = loadPublished();
  const publishedNums = new Set(published.map((p) => p.num));

  // 실발행이면 clubid/menuid 필수 + 토큰 1회 갱신 후 재사용
  let accessToken = null;
  if (GO) {
    if (!CLUB_ID) {
      console.error('❌ clubid 가 필요합니다. .env.local 의 NAVER_CAFE_CLUB_ID 또는 --clubid');
      process.exit(1);
    }
    console.log('🔑 access_token 갱신 중…');
    accessToken = await refreshAccessToken();
  }

  // --count 는 --next --go 조합에서만 반복. 그 외엔 1개.
  const total = (NEXT && GO) ? COUNT : 1;
  let done = 0;
  for (let i = 0; i < total; i++) {
    const target = pickTarget(publishedNums);
    if (!target) { console.log('✅ 미발행 글이 없습니다. 모두 발행 완료.'); break; }
    if (NEXT) console.log(`[${i + 1}/${total}] --next 선택: ${target.num} (${target.file})`);
    const ok = await publishOne(target, accessToken, published, publishedNums);
    if (ok) done++;
    if (ok && i < total - 1) {
      console.log(`⏳ ${DELAY_SEC}초 대기 (연속 등록 제한 회피)…`);
      await sleep(DELAY_SEC * 1000);
    }
  }
  if (GO) console.log(`\n📌 이번 실행 발행 ${done}개.`);
}

main().catch((e) => { console.error(`\n❌ ${e.message}`); process.exit(1); });
