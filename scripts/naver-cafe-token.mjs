#!/usr/bin/env node
/**
 * 네이버 카페 API OAuth 토큰 1회 발급 스크립트 (반자동)
 *
 * 흐름:
 *   1) http://localhost:8899 로컬 서버를 띄운다.
 *   2) 네이버 authorize URL을 만들어 macOS `open`으로 브라우저를 연다.
 *   3) 사용자가 네이버 로그인/동의 → /callback 으로 code+state 수신.
 *   4) state 검증 후 access_token / refresh_token 교환.
 *   5) 프로젝트 루트 `.env.naver-cafe-token.json` 에 저장(.env* → gitignore 됨).
 *
 * 사전 준비(사용자): 네이버 개발자센터에서
 *   - 카페 API 사용 권한 추가
 *   - Callback URL 에 http://localhost:8899/callback 등록
 *   - .env.local 에 NAVER_CAFE_CLIENT_ID/SECRET 또는 NAVER_CLIENT_ID/SECRET
 *
 * 사용법: node scripts/naver-cafe-token.mjs
 */
import fs from 'fs';
import path from 'path';
import http from 'http';
import crypto from 'crypto';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// .env.local 파싱 (collect-violations.mjs 방식 재사용)
const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n');
const getEnv = (k) => (env.find((l) => l.startsWith(`${k}=`)) || '').slice(k.length + 1).trim();

const CLIENT_ID = getEnv('NAVER_CAFE_CLIENT_ID') || getEnv('NAVER_CLIENT_ID');
const CLIENT_SECRET = getEnv('NAVER_CAFE_CLIENT_SECRET') || getEnv('NAVER_CLIENT_SECRET');
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ NAVER_CAFE_CLIENT_ID/SECRET (또는 NAVER_CLIENT_ID/SECRET) 가 .env.local 에 없습니다.');
  process.exit(1);
}

const PORT = 8899;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const TOKEN_FILE = path.join(ROOT, '.env.naver-cafe-token.json');
const STATE = crypto.randomBytes(16).toString('hex');

const AUTHORIZE_URL =
  'https://nid.naver.com/oauth2.0/authorize?response_type=code' +
  `&client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&state=${encodeURIComponent(STATE)}`;

function html(body) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>네이버 카페 토큰</title></head>` +
    `<body style="font-family:-apple-system,system-ui,sans-serif;padding:48px;text-align:center;color:#222">` +
    body + `</body></html>`;
}

async function exchangeToken(code, state) {
  const url =
    'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code' +
    `&client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&client_secret=${encodeURIComponent(CLIENT_SECRET)}` +
    `&code=${encodeURIComponent(code)}` +
    `&state=${encodeURIComponent(state)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'archLegal-cafe/1.0' } });
  const json = await res.json().catch(() => ({}));
  if (!json.access_token) {
    const reason = json.error_description || json.error || JSON.stringify(json);
    throw new Error(`토큰 교환 실패: ${reason}`);
  }
  return json;
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  if (u.pathname !== '/callback') {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html('<h2>대기 중…</h2><p>브라우저에서 네이버 로그인/동의를 진행하세요.</p>'));
    return;
  }

  const error = u.searchParams.get('error');
  const code = u.searchParams.get('code');
  const state = u.searchParams.get('state');

  try {
    if (error) {
      throw new Error(`네이버 인증 거부: ${error} (${u.searchParams.get('error_description') || ''})`);
    }
    if (!code) throw new Error('code 파라미터가 없습니다.');
    if (state !== STATE) throw new Error('state 불일치 (CSRF 방지 검증 실패) — 다시 실행하세요.');

    const token = await exchangeToken(code, state);
    const payload = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_type: token.token_type || 'bearer',
      expires_in: token.expires_in ? Number(token.expires_in) : null,
      obtained_at: new Date().toISOString(),
    };
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html('<h2>✅ 발급 완료</h2><p>터미널로 돌아가세요. 이 창은 닫아도 됩니다.</p>'));
    console.log('\n✅ 토큰 발급 완료');
    console.log(`   저장 위치: ${TOKEN_FILE}`);
    console.log(`   access_token: ${token.access_token.slice(0, 12)}…`);
    console.log(`   refresh_token: ${token.refresh_token ? token.refresh_token.slice(0, 12) + '…' : '(없음)'}`);
    console.log('\n다음: node scripts/publish-cafe.mjs 001  (dry-run 미리보기)');
    setTimeout(() => { server.close(); process.exit(0); }, 300);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html(`<h2>❌ 실패</h2><p>${e.message}</p><p>터미널을 확인하세요.</p>`));
    console.error(`\n❌ ${e.message}`);
    setTimeout(() => { server.close(); process.exit(1); }, 300);
  }
});

server.listen(PORT, () => {
  console.log(`로컬 콜백 서버: ${REDIRECT_URI}`);
  console.log('브라우저를 엽니다. 네이버 로그인/동의를 진행하세요.\n');
  console.log('브라우저가 자동으로 열리지 않으면 아래 URL을 직접 여세요:\n' + AUTHORIZE_URL + '\n');
  exec(`open ${JSON.stringify(AUTHORIZE_URL)}`, (err) => {
    if (err) console.log('(자동 열기 실패 — 위 URL을 직접 붙여넣으세요)');
  });
});
