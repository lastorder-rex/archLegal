/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true });
const rpc = jest.fn();
const from = jest.fn();
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn(() => ({ rpc, from })) }));
jest.mock('bcryptjs', () => ({ __esModule: true, default: { compare: jest.fn() } }));
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { COOKIE_NAME, issueSession, verifySession, readData, login, logout } from '../server';

const passwordHash = '$2b$12$' + 'a'.repeat(53);
function request(path: string, options: RequestInit = {}) {
  return new NextRequest(`http://localhost:3002/api/private-case/${path}`, options);
}
beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(process.env, {
    PRIVATE_CASE_ALLOWED_ORIGIN: 'http://localhost:3002',
    PRIVATE_CASE_SUPABASE_URL: 'https://test.supabase.co',
    PRIVATE_CASE_SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    PRIVATE_CASE_KEY: '00000000-0000-0000-0000-000000000001',
    PRIVATE_CASE_PASSWORD_HASH: passwordHash,
    PRIVATE_CASE_SESSION_SECRET: 's'.repeat(40),
  });
});
test('signed sessions expire, reject forgery and rotate with password or case', () => {
  const now = Date.now();
  const session = issueSession(now);
  expect(verifySession(session.token, now)).toBe(session.expiresAt);
  expect(verifySession(session.token, session.expiresAt)).toBeNull();
  expect(verifySession(session.token + 'x', now)).toBeNull();
  process.env.PRIVATE_CASE_PASSWORD_HASH = '$2b$12$' + 'b'.repeat(53);
  expect(verifySession(session.token, now)).toBeNull();
});
test('unauthenticated and forged requests never create a database client', async () => {
  expect((await readData(request('data'))).status).toBe(401);
  expect((await readData(request('data', { headers: { cookie: `${COOKIE_NAME}=forged` } }))).status).toBe(401);
  expect(createClient).not.toHaveBeenCalled();
});
test('expired request never creates a database client', async () => {
  const token = issueSession(Date.now() - 9 * 60 * 60 * 1000).token;
  expect((await readData(request('data', { headers: { cookie: `${COOKIE_NAME}=${token}` } }))).status).toBe(401);
  expect(createClient).not.toHaveBeenCalled();
});
test('cross-origin and missing-origin mutations are rejected before database calls', async () => {
  const options = { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: JSON.stringify({ password: 'test' }) };
  expect((await login(request('login', options))).status).toBe(403);
  expect((await logout(request('logout', options))).status).toBe(403);
  expect((await login(request('login', { method: 'POST' }))).status).toBe(403);
  expect(createClient).not.toHaveBeenCalled();
});
test('login fails closed when durable limiter is unavailable', async () => {
  rpc.mockResolvedValue({ error: { message: 'not installed' }, data: null });
  const result = await login(request('login', { method: 'POST', headers: { origin: 'http://localhost:3002', 'content-type': 'application/json' }, body: JSON.stringify({ password: 'test' }) }));
  expect(result.status).toBe(503);
  expect(result.headers.get('set-cookie')).toBeNull();
});
test('oversized password rejected without consuming DB resources', async () => {
  const result = await login(request('login', { method: 'POST', headers: { origin: 'http://localhost:3002', 'content-type': 'application/json' }, body: JSON.stringify({ password: 'a'.repeat(73) }) }));
  expect(result.status).toBe(400);
  expect(createClient).not.toHaveBeenCalled();
});
test('authenticated reads filter by configured case and allowlisted source, latest only', async () => {
  const chain = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue({ data: [{ payload: { synthetic: true } }], error: null }) };
  from.mockReturnValue(chain);
  const token = issueSession().token;
  const response = await readData(request('data', { headers: { cookie: `${COOKIE_NAME}=${token}` } }));
  expect(response.status).toBe(200);
  expect(chain.eq).toHaveBeenCalledWith('case_key', process.env.PRIVATE_CASE_KEY);
  expect(chain.order).toHaveBeenCalledWith('imported_at', { ascending: false });
  expect(chain.limit).toHaveBeenCalledWith(1);
  expect(Object.keys((await response.json()).documents)).toHaveLength(7);
  expect(response.headers.get('cache-control')).toContain('no-store');
});

function loginRequest() {
  return request('login', { method: 'POST', headers: { origin: 'http://localhost:3002', 'content-type': 'application/json' }, body: JSON.stringify({ password: 'test' }) });
}
test('denied budget never checks password and returns no cookie', async () => {
  rpc.mockResolvedValue({ data: false, error: null });
  const response = await login(loginRequest());
  expect(response.status).toBe(429);
  expect(bcrypt.compare).not.toHaveBeenCalled();
  expect(response.headers.get('set-cookie')).toBeNull();
});
test('wrong password gets no cookie, correct password gets signed HttpOnly Strict cookie', async () => {
  rpc.mockResolvedValue({ data: true, error: null });
  (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const wrong = await login(loginRequest());
  expect(wrong.status).toBe(401);
  expect(wrong.headers.get('set-cookie')).toBeNull();
  const correct = await login(loginRequest());
  expect(correct.status).toBe(200);
  expect(correct.headers.get('set-cookie')).toContain('HttpOnly');
  expect(correct.headers.get('set-cookie')).toContain('SameSite=strict');
  expect(verifySession(correct.cookies.get(COOKIE_NAME)?.value)).not.toBeNull();
});
test('same-origin logout clears cookie', async () => {
  const response = await logout(request('logout', { method: 'POST', headers: { origin: 'http://localhost:3002' } }));
  expect(response.status).toBe(200);
  expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
});
