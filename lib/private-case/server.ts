import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-private-case-session' : 'private-case-session';
export const SESSION_SECONDS = 8 * 60 * 60;
export const SOURCE_NAMES = [
  'baseline.json', 'ambulance-2026-07-01.json', 'emergency-record-2026-07-01.json',
  'health-checkup-results.json', 'health-questionnaires.json', 'basic-care-history.json',
  'travel-records-2026.json', 'attendance-2026-h1.json',
] as const;

function config() {
  const url = process.env.PRIVATE_CASE_SUPABASE_URL;
  const key = process.env.PRIVATE_CASE_SUPABASE_SERVICE_ROLE_KEY;
  const caseKey = process.env.PRIVATE_CASE_KEY;
  const passwordHash = process.env.PRIVATE_CASE_PASSWORD_HASH;
  const secret = process.env.PRIVATE_CASE_SESSION_SECRET;
  if (!url || !key || !caseKey || !passwordHash || !secret || secret.length < 32 ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseKey) ||
      !/^\$2[aby]\$(1[0-6])\$[./A-Za-z0-9]{53}$/.test(passwordHash)) throw new Error('Private case configuration unavailable');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error('Private case configuration unavailable');
  return { url, key, caseKey, passwordHash, secret };
}

function signature(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}
function equal(a: string, b: string) {
  const aa = Buffer.from(a), bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
function version(hash: string, caseKey: string) {
  return createHash('sha256').update(`${caseKey}:${hash}`).digest('base64url');
}
export function issueSession(now = Date.now()) {
  const c = config();
  const expiresAt = now + SESSION_SECONDS * 1000;
  const body = Buffer.from(JSON.stringify({ expiresAt, version: version(c.passwordHash, c.caseKey) })).toString('base64url');
  return { token: `${body}.${signature(body, c.secret)}`, expiresAt };
}
export function verifySession(token: string | undefined, now = Date.now()): number | null {
  if (!token || token.length > 1024) return null;
  try {
    const c = config();
    const parts = token.split('.');
    if (parts.length !== 2 || !equal(signature(parts[0], c.secret), parts[1])) return null;
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    if (!Number.isSafeInteger(payload.expiresAt) || payload.expiresAt <= now ||
        payload.expiresAt > now + SESSION_SECONDS * 1000 ||
        payload.version !== version(c.passwordHash, c.caseKey)) return null;
    return payload.expiresAt;
  } catch { return null; }
}
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowed = process.env.PRIVATE_CASE_ALLOWED_ORIGIN;
  if (!allowed && process.env.NODE_ENV === 'production') return false;
  return origin === (allowed || request.nextUrl.origin) && request.headers.get('sec-fetch-site') !== 'cross-site';
}
export function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: {
    'Cache-Control': 'private, no-store, max-age=0', 'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff', 'Vary': 'Cookie',
  } });
}
export function setSession(response: NextResponse, token: string, maxAge = SESSION_SECONDS) {
  response.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge });
}
function database() {
  const c = config();
  return createClient(c.url, c.key, { auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(10000) }) } });
}

export async function login(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ error: '허용되지 않은 요청입니다.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: '잘못된 요청입니다.' }, 400);
  // Read a bounded stream, including chunked requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: '잘못된 요청입니다.' }, 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024) { await reader.cancel(); return reply({ error: '잘못된 요청입니다.' }, 400); }
      chunks.push(value);
    }
    const { password } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (typeof password !== 'string' || password.length < 1 || Buffer.byteLength(password) > 72) return reply({ error: '잘못된 요청입니다.' }, 400);
    const c = config();
    // Atomic DB-backed budget shared by all instances, IPs and deployment aliases.
    const { data, error } = await database().rpc('private_case_consume_login_attempt', { p_case_key: c.caseKey });
    if (error || typeof data !== 'boolean') return reply({ error: '접속 준비 중입니다. 관리자에게 문의해 주세요.' }, 503);
    if (!data) return reply({ error: '입력 횟수를 초과했습니다. 15분 후 다시 시도해 주세요.' }, 429);
    if (!await bcrypt.compare(password, c.passwordHash)) return reply({ error: '비밀번호를 확인해 주세요.' }, 401);
    const session = issueSession();
    const response = reply({ ok: true, expiresAt: session.expiresAt });
    setSession(response, session.token);
    return response;
  } catch (e) { if (process.env.NODE_ENV !== 'production') console.error('[private-case] login unavailable:', e instanceof Error ? e.message : e); return reply({ error: '접속 준비 중입니다. 관리자에게 문의해 주세요.' }, 503); }
}
export async function readData(request: NextRequest) {
  const expiresAt = verifySession(request.cookies.get(COOKIE_NAME)?.value);
  if (!expiresAt) return reply({ error: '비밀번호를 입력해 주세요.' }, 401);
  try {
    const c = config();
    const db = database();
    const rows = await Promise.all(SOURCE_NAMES.map(async (name) => {
      const { data, error } = await db.from('private_case_staging').select('payload')
        .eq('case_key', c.caseKey).eq('source_name', name).order('imported_at', { ascending: false }).limit(1);
      if (error) throw new Error('Read unavailable');
      return [name, data?.[0]?.payload] as const;
    }));
    const documents: Record<string, unknown> = Object.fromEntries(rows.filter(([, payload]) => payload != null));
    // 개발 전용: DB 적재 전 로컬 검토용 보강. 운영 빌드에서는 디렉터리 설정이 없어 동작하지 않는다.
    const localDir = process.env.NODE_ENV !== 'production' ? process.env.PRIVATE_CASE_LOCAL_DIR : undefined;
    if (localDir) {
      const { readFile } = await import('fs/promises'); const { join, basename } = await import('path');
      for (const name of SOURCE_NAMES) {
        if (name in documents) continue;
        try { documents[name] = JSON.parse(await readFile(join(localDir, basename(name)), 'utf8')); } catch { /* 로컬 파일 없음 */ }
      }
    }
    return reply({ documents, expiresAt });
  } catch (e) { if (process.env.NODE_ENV !== 'production') console.error('[private-case] read unavailable:', e instanceof Error ? e.message : e); return reply({ error: '자료를 불러오지 못했습니다.' }, 503); }
}
export async function logout(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ error: '허용되지 않은 요청입니다.' }, 403);
  const response = reply({ ok: true });
  setSession(response, '', 0);
  return response;
}
