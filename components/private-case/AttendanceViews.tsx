import { Table, obj, list, text, type Obj } from './RecordViews';

const num = (v: unknown) => typeof v === 'number' ? v : 0;
const hm = (v: unknown) => v == null ? '' : `${Math.floor(num(v) / 60)}:${String(num(v) % 60).padStart(2, '0')}`;
const md = (iso: unknown) => text(iso).slice(5).replace('-', '/');
const h1 = (v: unknown) => `${num(v).toFixed(1)}h`;
const KIND_LABEL: Record<string, string> = { card: '출입카드', travel: '출장 이동', laptop: '노트북 로그', assumed: '추정', off: '회사 휴무' };

function Notes({ title, values }: { title: string; values: unknown }) {
  return <details><summary>{title}</summary><ul>{list(values).map((v, i) => <li key={i}>{text(v)}</li>)}</ul></details>;
}
function Legend({ data }: { data: Obj }) {
  return <p className="pc-source pc-legend">{list(data.legend).map((v, i) => { const l = obj(v); return <span key={i} className={`pc-k pc-k-${text(l.kind)}`}>{text(l.label)}</span>; })}</p>;
}

export function Attendance({ data, month, onMonth }: { data: Obj; month: string; onMonth: (v: string) => void }) {
  const months = list(data.months).map(obj), days = list(data.days).map(obj), total = obj(data.total);
  const current = months.some(m => `${m.year}-${m.month}` === month) ? month : '';
  const shown = days.filter(d => !current || text(d.date).startsWith(`${current.split('-')[0]}-${String(current.split('-')[1]).padStart(2, '0')}`));
  const rowClass = (d: Obj) => d.holiday ? 'pc-r-holiday' : d.kind === 'off' ? 'pc-r-off' : d.kind === 'assumed' ? 'pc-r-assumed' : d.kind === 'travel' || d.kind === 'laptop' ? 'pc-r-trip' : d.weekend ? 'pc-r-weekend' : '';
  return <><h2>근무기록</h2>
    <p className="pc-source">{text(obj(data.period).start)} ~ {text(obj(data.period).end)} · 발병일 {text(obj(data.period).onset_date)} · 출근 {text(total.work_days)}일 · 총 {hm(total.work_min)} · 야간가산 환산 {hm(total.adj_min)}</p>
    <h3>월별 합계 <span className="pc-source">(최근 월부터)</span></h3>
    <Table headers={['월', '출근일', '총 근무시간', '야간(22~06)', '야간가산 30%', '환산 근무시간', '공휴일·휴무']} rows={months.map(m => [
      <button key="m" type="button" className="pc-link" aria-pressed={current === `${m.year}-${m.month}`} onClick={() => onMonth(current === `${m.year}-${m.month}` ? '' : `${m.year}-${m.month}`)}>{text(m.label)}</button>,
      `${text(m.work_days)}일`, hm(m.work_min), hm(m.night_min), hm(m.add_min), hm(m.adj_min),
      [`공휴일 ${list(m.holidays).length}일`, ...list(m.company_off).map(o => `회사 휴무 ${md(obj(o).date)}`)].join(' · '),
    ])} />
    <div className="pc-filters"><label>월 선택<select value={current} onChange={e => onMonth(e.target.value)}><option value="">전체 (6월 → 1월)</option>{months.map(m => <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{text(m.label)}</option>)}</select></label></div>
    <Legend data={data} />
    {(current ? [months.find(m => `${m.year}-${m.month}` === current)!] : months).map(m => {
      const key = `${m.year}-${String(m.month).padStart(2, '0')}`, rows = shown.filter(d => text(d.date).startsWith(key));
      return <article key={key}><h3>{text(m.label)} <span className="pc-source">{text(m.work_days)}일 출근 · {hm(m.work_min)} · 환산 {hm(m.adj_min)}</span></h3>
        <div className="pc-table-wrap pc-att"><table><thead><tr>{['날짜', '요일', '출근', '퇴근', '총 근무', '야간', '가산', '환산', '구분', '비고'].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{rows.map(d => <tr key={text(d.date)} className={rowClass(d)}>
            <td>{text(d.date)}</td><td>{text(d.weekday)}</td><td>{text(d.start)}</td><td>{text(d.end)}</td><td>{hm(d.work_min)}</td><td>{d.night_min ? hm(d.night_min) : ''}</td><td>{d.add_min ? hm(d.add_min) : ''}</td><td>{hm(d.adj_min)}</td>
            <td>{KIND_LABEL[text(d.kind)] ?? text(d.kind)}</td><td className="pc-note">{[d.holiday, d.note].filter(Boolean).map(text).join(' · ')}</td>
          </tr>)}</tbody></table></div></article>;
    })}
    <Notes title="산정 방식" values={data.method} /><Notes title="추정·보정 적용 내역" values={data.assumptions} /><Notes title="미확정 사항 (노무사님 검토 필요)" values={data.open_items} />
    <details><summary>자료 출처</summary><ul>{list(data.sources).map((v, i) => { const s = obj(v); return <li key={i}><strong>{text(s.kind)}</strong> · {text(s.name)} · {text(s.detail)}</li>; })}</ul></details></>;
}

export function WeeklySummary({ data }: { data: Obj }) {
  const blocks = list(data.weekly).map(obj), p = obj(data.precedent);
  return <><h2>근무 주별집계</h2>
    {blocks.map((b, i) => <article key={i}><h3>{text(b.title)} <span className="pc-source">{text(b.list_start)} ~ {text(b.end)}</span></h3>
      <Table headers={['산정', '기간', '출근일', '근무시간', '환산', '주평균', '환산 주평균']} rows={list(b.summary).map(v => { const r = obj(v); const hi = r.highlight === true;
        return [hi ? <strong key="n" className={text(r.name).startsWith('휴무') ? 'pc-excl' : ''}>{text(r.name)}</strong> : text(r.name), text(r.period).replace(/(\d{4})-/g, ''), `${text(r.work_days)}일`, hm(r.work_min), hm(r.adj_min), hi ? <strong key="h" className={text(r.name).startsWith('휴무') ? 'pc-excl' : ''}>{h1(r.avg_h)}</strong> : h1(r.avg_h), h1(r.adj_avg_h)]; })} />
      <Table headers={['주차', '기간', '출근일', '근무시간', '환산', '평일 휴일·휴무', '비고']} rows={list(b.weeks).map(v => { const w = obj(v); return [`${text(w.no)}주`, `${md(w.start)}~${md(w.end)}`, `${text(w.work_days)}일`, hm(w.work_min), hm(w.adj_min), list(w.offs).map(text).join(', '), text(w.note ?? '')]; })} />
      <Notes title="휴무 주 제외 근거" values={list(b.exclusions).map(v => `${text(obj(v).name)}: ${text(obj(v).reason)}`)} />
    </article>)}
    <h3>달력 분기 기준 (참고)</h3>
    <Table headers={['기간', '주 수', '출근일', '근무시간', '환산', '주평균', '환산 주평균']} rows={list(data.quarters).map(v => { const q = obj(v); return [text(q.label), `${text(q.weeks)}주`, `${text(q.work_days)}일`, hm(q.work_min), hm(q.adj_min), `${h1(q.avg_h)}`, `${h1(q.adj_avg_h)}`]; })} />
    <details><summary>휴무 주 제외 방식의 근거 판례</summary><p><strong>{text(p.court)} {text(p.case_no)}</strong> · {text(p.title)}</p><p className="pc-quote">{text(p.point)}</p><p className="pc-source">{text(p.url)}</p></details>
    <Notes title="산정 방식" values={data.method} /><Notes title="미확정 사항 (노무사님 검토 필요)" values={data.open_items} /></>;
}
