import type { ReactNode } from 'react';
export type Obj = Record<string, unknown>;
export const obj = (v: unknown): Obj => v && typeof v === 'object' && !Array.isArray(v) ? v as Obj : {};
export const list = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
export const text = (v: unknown): string => v == null ? '미기재' : String(v);
const num = (v: unknown) => typeof v === 'number' ? v : 0;
const money = (v: unknown) => num(v).toLocaleString('ko-KR');
const duration = (v: unknown) => {
  const s = num(v);
  return `${Math.floor(s / 3600)}시간 ${Math.floor(s % 3600 / 60)}분${s % 60 ? ` ${s % 60}초` : ''}`;
};
export function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return <div className="pc-table-wrap"><table><thead><tr>{headers.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>;
}
function Notes({ values, title = '자료 확인사항' }: { values: unknown; title?: string }) {
  return <details><summary>{title}</summary><ul>{list(values).map((v, i) => <li key={i}>{text(v)}</li>)}</ul></details>;
}
export function Diagnosis({ data }: { data: Obj }) {
  return <><h2>문서별 진단명과 코드</h2>{list(data.documents).map((v, i) => {
    const d = obj(v);
    return <article key={i}><h3>{text(d.institution)}</h3><p className="pc-source">{text(d.file_name)} · {text(d.page ?? list(d.pages).join('·'))}쪽 · 발급 {text(d.issued_on)}</p>
      {d.diagnoses ? <Table headers={['진단명', '원문 코드', '구분', '진단 상태']} rows={list(d.diagnoses).map(x => {
        const r = obj(x); return [text(r.name_raw), text(r.code_raw), r.primary === true ? '주상병' : r.primary === false ? '주상병 외' : '주상병 표시 없음', text(r.certainty)];
      })} /> : <p>{text(d.department)} · 입원 {text(d.admission_date)} ~ 퇴원 {text(d.discharge_date)}</p>}
      {Boolean(d.onset_date_raw) && <p className="pc-source">이 문서의 발병일: {text(d.onset_date_raw)} · 진단일: {text(d.diagnosis_date_raw)}</p>}
    </article>;
  })}<Notes values={[obj(data.case_onset).note, ...list(data.notes)].filter(Boolean)} /></>;
}
export function Ambulance({ data }: { data: Obj }) {
  return <><h2>119 이송결과</h2><p className="pc-source">{text(data.event_date)} · {text(obj(data.source).institution)}</p>
    <ol className="pc-timeline">{list(data.timeline).map((v, i) => { const t = obj(v); return <li key={i}><strong>{text(t.time_raw)}</strong><div>{text(t.event)}<p className="pc-source">{text(t.source_section)} · {text(t.page)}쪽</p></div></li>; })}</ol>
    <h3>현장 측정값</h3><Table headers={['시각', '혈압 mmHg', 'SpO₂ %', '맥박 /분', '호흡 /분', '체온 ℃', '혈당 mg/dL']} rows={list(data.vital_signs).map(v => { const r = obj(v), bp = obj(r.blood_pressure_mmhg); return [text(r.time), `${text(bp.systolic)}/${text(bp.diastolic)}`, text(r.spo2_percent), text(r.pulse_per_min), text(r.respiratory_rate_per_min), text(r.temperature_c), text(r.glucose_mg_dl)]; })} />
    <h3>처치 기록</h3><Table headers={['기록', '출처']} rows={list(data.treatments).map(v => { const r = obj(v); return [[r.device_raw, r.oxygen_flow_l_min ? `${r.oxygen_flow_l_min} L/분` : null, r.oxygen_raw, r.response_raw, r.fluid_raw, r.note].filter(Boolean).join(' · '), `${text(r.section)} · ${text(r.page)}쪽`]; })} />
    <details><summary>구급대원 평가소견 · 전사</summary><p className="pc-quote">{text(obj(data.narrative_transcription).text)}</p></details><Notes values={data.notes} /></>;
}
export function Emergency({ data }: { data: Obj }) {
  const complaint = obj(data.chief_complaint), pain = obj(data.pain);
  return <><h2>응급실 기록</h2><p className="pc-source">사용자 제공 발췌 · 원본 PDF 미대조</p><Table headers={['항목', '기재 내용']} rows={[
    ['주호소', text(complaint.raw)], ['증상 시작 시각', text(complaint.onset)], ['통증', `${text(pain.scale)} ${text(pain.score)}점 · 부위 ${text(pain.site)}`], ['활력징후 숫자열', text(obj(data.arrival_vitals).raw)],
  ]} /><h3>제공된 발췌 기록</h3><p className="pc-quote">{text(data.excerpt_spacing_normalized)}</p><details><summary>해석을 보류한 표현</summary><ul>{list(data.unresolved_raw).map((v, i) => <li key={i}>{text(v)}</li>)}</ul></details></>;
}
export function Questionnaire({ data }: { data: Obj }) {
  return <><h2>건강검진 문진표</h2><Table headers={['문항', '2022년', '2024년', '출처 셀']} rows={list(data.items).map(v => { const r = obj(v), a = obj(r.answers), x = obj(a['2022']), y = obj(a['2024']); return [text(r.question_raw), text(x.value_raw), text(y.value_raw), `${text(x.cell)} / ${text(y.cell)}`]; })} /></>;
}
export function Checkups({ data, year, onYear }: { data: Obj; year: string; onYear: (v: string) => void }) {
  const years = obj(data.years), keys = Object.keys(years).sort().reverse(), current = year in years ? year : keys[0], r = obj(years[current]);
  return <><h2>건강검진 요약</h2><label>검진 연도<select value={current} onChange={e => onYear(e.target.value)}>{keys.map(k => <option key={k}>{k}</option>)}</select></label><p className="pc-source">{text(r.source_label)} · {text(r.status_label)}</p>
    {list(r.findings).map((v, i) => { const x = obj(v); return <article key={i}><h3>{text(x.title)}</h3><p>{text(x.summary)}</p><details><summary>검진기관 권고문 보기</summary><p className="pc-quote">{text(x.original_text)}</p></details></article>; })}
    {list(r.tables).map((v, i) => { const t = obj(v); return <article key={i}><h3>{text(t.heading)}</h3><Table headers={list(t.headers).map(text)} rows={list(t.rows).map(row => list(row).map(v => text(v).replace(/\*\*/g, '')))} /></article>; })}<Notes values={list(r.notes).filter(note => text(note).trim() !== '권고문은 당시 검진기관의 안내로 보존했으며 새로운 진료 권고가 아닙니다.')} /></>;
}
export function History({ data, year, search, onYear, onSearch }: { data: Obj; year: string; search: string; onYear: (v: string) => void; onSearch: (v: string) => void }) {
  const all = list(data.records).map(obj), rows = all.filter(r => (!year || text(r.date).startsWith(year)) && `${text(r.institution)} ${text(r.department)}`.includes(search.trim()));
  return <><h2>년도별 병원 방문기록</h2><p className="pc-source">원문 {all.length}행 · 청구 내역 기준 · 진단명·질병코드·처방약 미기재</p>
    <Table headers={['연도', '병·의원', '약국', '전체 행 수', '본인부담금 원']} rows={list(obj(data.summary).by_year).map(v => { const y = obj(v); return [text(y.year), text(y.medical_institution_records), text(y.pharmacy_records), text(y.record_count), money(y.patient_paid_krw)]; })} />
    <div className="pc-filters"><label>진료 연도<select value={year} onChange={e => onYear(e.target.value)}><option value="">전체</option>{Array.from(new Set(all.map(r => text(r.date).slice(0, 4)))).sort().reverse().map(y => <option key={y}>{y}</option>)}</select></label><label>의료기관·진료과 검색<input type="search" value={search} onChange={e => onSearch(e.target.value)} /></label></div>
    <p className="pc-source" aria-live="polite">{rows.length}건 · 본인부담금 {rows.reduce((s, r) => s + num(r.paid), 0).toLocaleString('ko-KR')}원</p>
    {rows.length ? <Table headers={['순번', '진료일', '의료기관·약국', '진료과', '총 진료비 원', '보험 혜택 원', '본인부담 원', '원문 쪽']} rows={rows.map(r => [text(r.no), text(r.date), text(r.institution), text(r.department), money(r.total), money(r.benefit), money(r.paid), text(r.page)])} /> : <p>조건에 맞는 기록이 없습니다.</p>}<Notes values={data.notes} /></>;
}
export function Travel({ data }: { data: Obj }) {
  const routes = list(data.routes).map(obj), totals = obj(data.totals);
  const omittedNotes = [
    '업무 관련성·산입 여부는 미확정입니다.',
    '해외 이동에 적용할 시간대·업무시간 인정 여부·가산 적정성은 미검토입니다.',
    '인용된 6개 판정 사례는 엑셀 기재 그대로 보존했으며 해당 사건 원문과 이번 사실관계의 적용 가능성은 미대조입니다.',
  ];
  const notes = list(data.notes).map(value => omittedNotes.reduce((note, sentence) => note.replace(sentence, ''), text(value)).trim()).filter(Boolean);
  return <><h2>출장 기록</h2><p className="pc-source">{text(obj(data.source).name)} · {text(obj(data.source).sheet)} · {text(obj(data.source).range)}</p><Table headers={['집계 범위', '경과시간']} rows={[
    ['본 출장 이동 구간', duration(totals.main_travel_seconds)], ['전날 이동 포함 전체', duration(totals.all_elapsed_seconds)],
  ]} /><Table headers={['날짜', '시작 → 종료 KST', '경과시간', '경로·메모']} rows={routes.map(r => [text(r.date), `${text(r.start)} → ${text(r.end)}`, duration(r.elapsed_seconds), `${text(r.route)} / ${text(r.note)}`])} />
    <details><summary>야간 가산 시나리오 · KST 기준 가정</summary><Table headers={['날짜', '야간 겹침', '30% 가산량', '경과시간 + 가산']} rows={routes.map(r => [text(r.date), duration(r.night_seconds), duration(r.night_addition_seconds), duration(num(r.elapsed_seconds) + num(r.night_addition_seconds))])} /></details>
    {['outbound', 'inbound'].map((key, i) => { const t = obj(data[key]); return <article key={key}><h3>{i ? '귀국 항공편' : '출국 항공편'}</h3><Table headers={list(t.headers).map(text)} rows={list(t.rows).map(v => list(v).map(text))} /></article>; })}
    <Notes values={notes} /><details><summary>엑셀 인용 근거 · 원문 미대조</summary><p className="pc-quote">{text(data.cited_basis_raw)}</p></details></>;
}
