'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Ambulance, Checkups, Diagnosis, Emergency, History, Questionnaire, Travel, obj, text, list, type Obj } from './RecordViews';
import { Attendance, WeeklySummary } from './AttendanceViews';

const tabs = [
  ['diagnosis', '진단/기본정보', 'baseline.json'],
  ['ambulance', '119 이송결과', 'ambulance-2026-07-01.json'],
  ['emergency', '응급실 기록', 'emergency-record-2026-07-01.json'],
  ['checkups', '건강검진 요약', 'health-checkup-results.json'],
  ['questionnaire', '건강검진 문진표', 'health-questionnaires.json'],
  ['history', '년도별 병원 방문기록', 'basic-care-history.json'],
  ['travel', '출장 기록', 'travel-records-2026.json'],
  ['attendance', '근무기록', 'attendance-2026-h1.json'],
  ['weekly', '근무 주별집계', 'attendance-2026-h1.json'],
] as const;

export default function PrivateCaseRoom() {
  const [documents, setDocuments] = useState<Record<string, unknown> | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [logoutFailed, setLogoutFailed] = useState(false);
  const [tab, setTab] = useState<string>('diagnosis');
  const [year, setYear] = useState('');
  const [checkupYear, setCheckupYear] = useState('2025');
  const [month, setMonth] = useState('');
  const [search, setSearch] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const generation = useRef(0);
  const clear = useCallback(() => {
    generation.current += 1;
    setDocuments(null); setPassword(''); setExpiresAt(null); setSearch(''); setYear(''); setTab('diagnosis');
  }, []);

  const load = useCallback(async () => {
    const current = generation.current;
    try {
      const response = await fetch('/api/private-case/data', { cache: 'no-store' });
      if (current !== generation.current) return;
      if (response.status === 401) { clear(); return; }
      if (!response.ok) throw new Error('자료를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.');
      const payload = await response.json();
      if (current !== generation.current) return;
      setDocuments(obj(payload.documents));
      setExpiresAt(typeof payload.expiresAt === 'number' ? payload.expiresAt : null);
      setError('');
    } catch (e) {
      if (current === generation.current) { setDocuments(null); setError(e instanceof Error ? e.message : '자료 조회 실패'); }
    } finally { setBusy(false); }
  }, [clear]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!expiresAt) return;
    // Contract: expiry is epoch milliseconds.
    const timer = window.setTimeout(() => { clear(); setError('접속 시간이 만료되었습니다. 다시 로그인해 주세요.'); }, Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt, clear]);
  useEffect(() => {
    const hide = () => { clear(); };
    const locked = (event: StorageEvent) => { if (event.key === 'private-case-lock') { clear(); setBusy(false); } };
    window.addEventListener('storage', locked);
    const show = (event: PageTransitionEvent) => { if (event.persisted) { setBusy(true); void load(); } };
    window.addEventListener('pagehide', hide); window.addEventListener('pageshow', show);
    return () => { window.removeEventListener('storage', locked); window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', show); };
  }, [clear, load]);

  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/private-case/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }), cache: 'no-store' });
      setPassword('');
      if (!response.ok) {
        setError(response.status === 429 ? '시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.' : response.status === 503 ? '자료실 접속 설정을 준비 중입니다.' : '비밀번호를 확인해 주세요.');
        return;
      }
      await load();
    } catch { setError('서버에 연결할 수 없습니다.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    clear(); setBusy(true); setError(''); setLogoutFailed(false);
    try { window.localStorage.setItem('private-case-lock', String(Date.now())); } catch { /* No record data stored. */ }
    try { const response = await fetch('/api/private-case/logout', { method: 'POST', cache: 'no-store' }); if (!response.ok) throw new Error(); }
    catch { setLogoutFailed(true); setError('화면은 잠겼지만 서버 로그아웃 확인에 실패했습니다. 로그아웃을 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  }

  const baseline = obj(documents?.['baseline.json']), person = obj(baseline.person), onset = obj(baseline.case_onset);
  const admission = obj(list(baseline.documents).find(d => obj(d).id === 'admission'));
  const selected = tabs.find(t => t[0] === tab) ?? tabs[0];
  const available = documents && Object.prototype.hasOwnProperty.call(documents, selected[2]);
  const data: Obj = obj(documents?.[selected[2]]);

  return <main className="pc-room">
    {!documents ? <section className="pc-login" aria-labelledby="pc-login-title"><p className="pc-eyebrow">PRIVATE RECORDS</p><h1 id="pc-login-title">비공개 자료실</h1><p className="pc-source">접속 비밀번호를 입력해 주세요.</p><form onSubmit={login}><label htmlFor="pc-password">비밀번호</label><input id="pc-password" type="password" autoComplete="current-password" maxLength={128} value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} /><button type="submit" disabled={busy}>{busy ? '확인 중…' : '자료실 열기'}</button></form>{error && <p role="alert">{error}</p>}{logoutFailed && <button type="button" onClick={logout} disabled={busy}>로그아웃 다시 시도</button>}</section> : <>
      <header><div><p className="pc-eyebrow">산재 신청 기초자료 · 비공개</p><h1>{person.name ? `${text(person.name).slice(1)} 자료 모아보기` : '개인 자료실'}</h1></div><button type="button" className="pc-secondary" onClick={logout}>로그아웃</button></header>
      <dl className="pc-profile"><div><dt>생년월일</dt><dd>{text(person.birth_date)}</dd></div><div><dt>발병일</dt><dd>{text(onset.date)}</dd></div><div><dt>입원 기록</dt><dd>{text(admission.admission_date)} ~ {text(admission.discharge_date)}</dd></div></dl>
      <nav aria-label="자료 선택">{tabs.map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</nav>
      <section aria-label={selected[1]}>{!available ? <><h2>{selected[1]}</h2><p className="pc-source">아직 DB에 등록되지 않은 자료입니다.</p></> : <>
        {tab === 'diagnosis' && <Diagnosis data={data} />}{tab === 'ambulance' && <Ambulance data={data} />}{tab === 'emergency' && <Emergency data={data} />}
        {tab === 'checkups' && <Checkups data={data} year={checkupYear} onYear={setCheckupYear} />}{tab === 'questionnaire' && <Questionnaire data={data} />}
        {tab === 'history' && <History data={data} year={year} search={search} onYear={setYear} onSearch={setSearch} />}{tab === 'travel' && <Travel data={data} />}
        {tab === 'attendance' && <Attendance data={data} month={month} onMonth={setMonth} />}{tab === 'weekly' && <WeeklySummary data={data} />}
      </>}</section>
    </>}
  </main>;
}
