import type { CSSProperties } from 'react';
import type { DiagnosisResult } from '@/lib/diagnosis/legalization';
import { KakaoTalkIcon, ResultList, ResultText } from './parts';

type ResultViewProps = {
  active: boolean;
  result: DiagnosisResult | null;
  summary: string[];
  copyText: string;
  onConsult: () => void;
  onShare: () => void;
  onRestart: () => void;
};

export function ResultView({ active, result, summary, copyText, onConsult, onShare, onRestart }: ResultViewProps) {
  return (
    <section className={`view ${active ? 'active' : ''}`}>
      <div className="result-layout">
        <div>
          <article className="result-hero" style={{ '--result-color': result?.color || 'var(--primary)' } as CSSProperties}>
            <div className="result-chip">{result?.chip || '결과'}</div>
            <h2 className="result-title">{result?.title}</h2>
            <p className="result-copy">{result?.copy}</p>
          </article>

          <div className="result-grid">
            <section className="result-box">
              <h3>다음 액션</h3>
              <ResultList items={result?.actions || []} />
            </section>
            <section className="result-box">
              <h3>확인 필요 서류</h3>
              <ResultList items={result?.documents || []} />
            </section>
            <section className="result-box">
              <h3>진단 요약</h3>
              <ResultText text={copyText || summary.join('\n')} />
            </section>
            <section className="result-box">
              <h3>주의사항</h3>
              <ResultList items={result?.cautions || []} />
            </section>
          </div>

          <div className="result-actions">
            <button className="primary-btn" type="button" onClick={onConsult}>
              무료상담 신청하기
            </button>
            <button className="secondary-btn share-btn" type="button" onClick={onShare}>
              <KakaoTalkIcon />
              이 자가진단 링크 공유하기
            </button>
            <button className="ghost-btn" type="button" onClick={onRestart}>
              다시 진단하기
            </button>
          </div>
        </div>

        <aside className="contact-card" id="contact-card">
          <div className="pill contact-pill">인터월드 상담 연결</div>
          <h2>
            전문가가 확인하면
            <br />
            놓치는 조건이 줄어듭니다.
          </h2>
          <p>진단 결과를 복사한 뒤 아래 번호로 연락하면 확인해야 할 항목을 빠르게 이어서 상담할 수 있습니다.</p>
          <div className="contact-actions">
            <div className="phone-card">
              <span>상담 휴대폰</span>
              <strong>010-8742-1008</strong>
              <small>평일 09:00-18:00 상담팀 연결</small>
            </div>
            <a className="primary-btn call-link" href="tel:01087421008">
              전화 상담 연결
            </a>
            <button className="secondary-btn" type="button" onClick={onConsult}>
              무료상담 신청하기
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
