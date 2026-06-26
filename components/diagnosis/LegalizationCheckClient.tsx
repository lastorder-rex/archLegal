'use client';

import Script from 'next/script';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ConsultationModal } from '@/components/landing/ConsultationModal';
import { getAuthErrorMessage } from '@/lib/auth/errors';

type KakaoShareTemplate = {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
};

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share?: {
        sendDefault: (template: KakaoShareTemplate) => void;
      };
    };
  }
}

const KAKAO_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
const DIAGNOSIS_SHARE_TITLE = '1분 양성화 자가진단';
const DIAGNOSIS_SHARE_DESCRIPTION = '우리 건물도 특정건축물 특별조치법 대상인지 확인해보세요.';
const DIAGNOSIS_SHARE_ORIGIN = 'https://www.archlegal.co.kr';
const DIAGNOSIS_SHARE_IMAGE_URL = 'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/kakao_b.png';

type DiagnosisAnswer = {
  questionId: string;
  optionId: string;
};

type DiagnosisHistoryItem = {
  id: string;
  question: string;
  label: string;
  law: string;
  flag: string | null;
  typeLabel: string | null;
};

type DiagnosisQuestion = {
  id: string;
  badge: string;
  title: string;
  desc: string;
  hint: string;
  law: string;
  options: Array<{
    id: string;
    label: string;
    detail?: string;
    icon?: string;
    tone?: string;
  }>;
};

type DiagnosisResult = {
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  status: 'high' | 'review' | 'info' | 'fail';
  color: string;
  chip: string;
  title: string;
  copy: string;
  actions: string[];
  documents: string[];
  cautions: string[];
};

type DiagnosisResponse =
  | {
      type: 'question';
      question: DiagnosisQuestion;
      history: DiagnosisHistoryItem[];
      progress: { done: number; total: number; percent: number };
    }
  | {
      type: 'result';
      result: DiagnosisResult;
      history: DiagnosisHistoryItem[];
      flags: string[];
      summary: string[];
      copyText: string;
      progress: { done: number; total: number; percent: number };
    };

type View = 'landing' | 'quiz' | 'result';

function ResultList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ResultText({ text }: { text: string }) {
  return <pre className="result-text">{text}</pre>;
}

function KakaoTalkIcon() {
  return (
    <span className="kakao-talk-icon" aria-hidden="true">
      TALK
    </span>
  );
}

export function LegalizationCheckClient() {
  const [view, setView] = useState<View>('landing');
  const [answers, setAnswers] = useState<DiagnosisAnswer[]>([]);
  const [question, setQuestion] = useState<DiagnosisQuestion | null>(null);
  const [history, setHistory] = useState<DiagnosisHistoryItem[]>([]);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [summary, setSummary] = useState<string[]>([]);
  const [copyText, setCopyText] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 12, percent: 0 });
  const [toast, setToast] = useState('');
  const [isDark] = useState(false);
  const [isConsultationOpen, setConsultationOpen] = useState(false);
  const [consultationInitialMessage, setConsultationInitialMessage] = useState('');

  const rootClassName = useMemo(() => `diagnosis-root${isDark ? ' dark-mode' : ''}`, [isDark]);

  const initializeKakaoSdk = () => {
    if (!KAKAO_JAVASCRIPT_KEY || !window.Kakao || window.Kakao.isInitialized()) {
      return;
    }

    window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
  };

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const url = new URL(window.location.href);
    let shouldCleanUrl = false;

    const authError = url.searchParams.get('auth_error');
    if (authError) {
      setToast(getAuthErrorMessage(authError) ?? '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      url.searchParams.delete('auth_error');
      shouldCleanUrl = true;
    }

    if (url.searchParams.get('consultation') === 'open') {
      setConsultationInitialMessage(window.sessionStorage.getItem('legalizationDiagnosisSummary') || '');
      setConsultationOpen(true);
      url.searchParams.delete('consultation');
      shouldCleanUrl = true;
    }

    if (shouldCleanUrl) {
      const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, '', cleanUrl || '/');
    }
  }, []);

  const requestDiagnosis = async (nextAnswers: DiagnosisAnswer[]) => {
    const response = await fetch('/api/diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: nextAnswers })
    });

    if (!response.ok) {
      throw new Error('diagnosis request failed');
    }

    return response.json() as Promise<DiagnosisResponse>;
  };

  const applyDiagnosis = (diagnosis: DiagnosisResponse) => {
    setHistory(diagnosis.history || []);
    setProgress(diagnosis.progress);

    if (diagnosis.type === 'result') {
      setQuestion(null);
      setResult(diagnosis.result);
      setSummary(diagnosis.summary || []);
      setCopyText(diagnosis.copyText || '');
      setView('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setQuestion(diagnosis.question);
    setResult(null);
    setSummary([]);
    setCopyText('');
  };

  const loadDiagnosisState = async (nextAnswers: DiagnosisAnswer[]) => {
    try {
      const diagnosis = await requestDiagnosis(nextAnswers);
      applyDiagnosis(diagnosis);
    } catch (error) {
      console.error(error);
      setToast('자가진단 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const startDiagnosis = async () => {
    setAnswers([]);
    setView('quiz');
    await loadDiagnosisState([]);
  };

  const restart = () => {
    setAnswers([]);
    setQuestion(null);
    setHistory([]);
    setResult(null);
    setSummary([]);
    setCopyText('');
    setProgress({ done: 0, total: 12, percent: 0 });
    setView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // const scrollToInfo = () => {
  //   document.getElementById('info-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // };

  const answer = async (optionId: string) => {
    if (!question) {
      return;
    }

    const nextAnswers = [...answers, { questionId: question.id, optionId }];
    setAnswers(nextAnswers);
    await loadDiagnosisState(nextAnswers);
  };

  const goBack = async () => {
    if (!answers.length) {
      setView('landing');
      return;
    }

    const nextAnswers = answers.slice(0, -1);
    setAnswers(nextAnswers);
    setView('quiz');
    await loadDiagnosisState(nextAnswers);
  };

  const copySummary = async () => {
    if (!copyText) {
      setToast('복사할 진단 결과가 없습니다.');
      return;
    }

    try {
      await navigator.clipboard.writeText(copyText);
      setToast('진단 결과가 복사되었습니다.');
    } catch {
      setToast('브라우저에서 복사를 지원하지 않습니다. 상담 연결 시 진단 화면을 함께 보여주세요.');
    }
  };

  const fallbackShareDiagnosisLink = async (shareUrl: string) => {
    const shareData = {
      title: DIAGNOSIS_SHARE_TITLE,
      text: DIAGNOSIS_SHARE_DESCRIPTION,
      url: shareUrl
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    setToast('자가진단 링크가 복사되었습니다.');
  };

  const shareDiagnosisLink = async () => {
    const shareUrl = `${DIAGNOSIS_SHARE_ORIGIN}/check`;

    try {
      initializeKakaoSdk();

      if (window.Kakao?.Share && window.Kakao.isInitialized()) {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: DIAGNOSIS_SHARE_TITLE,
            description: DIAGNOSIS_SHARE_DESCRIPTION,
            imageUrl: DIAGNOSIS_SHARE_IMAGE_URL,
            imageWidth: 800,
            imageHeight: 800,
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl
            }
          },
          buttons: [
            {
              title: '자가진단 시작하기',
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl
              }
            }
          ]
        });
        return;
      }

      await fallbackShareDiagnosisLink(shareUrl);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      try {
        await fallbackShareDiagnosisLink(shareUrl);
      } catch {
        setToast('공유를 지원하지 않는 브라우저입니다. 주소창의 링크를 복사해주세요.');
      }
    }
  };

  const openConsultation = () => {
    if (copyText) {
      window.sessionStorage.setItem('legalizationDiagnosisSummary', copyText);
      setConsultationInitialMessage(copyText);
    } else {
      setConsultationInitialMessage(window.sessionStorage.getItem('legalizationDiagnosisSummary') || '');
    }
    setConsultationOpen(true);
  };

  return (
    <div className={rootClassName}>
      {KAKAO_JAVASCRIPT_KEY ? (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js"
          strategy="afterInteractive"
          onLoad={initializeKakaoSdk}
        />
      ) : null}
      <div className="app-shell">
        <main>
          <section className={`view ${view === 'landing' ? 'active' : ''}`}>
            <div className="hero-grid">
              <article className="hero-card">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" /> 2026년 특별조치법 대비 · 1분 자가진단
                  </div>
                  <h1>
                    우리 건물,
                    <br />
                    양성화 가능성이
                    <br />
                    있는지 먼저 확인하세요.
                  </h1>
                  <p className="hero-copy">
                    불법·무허가·준공미필·무단 용도변경 건축물이 법 요건에 들어오는지 O/X와 간단한 객관식으로
                    확인합니다. 결과가 애매한 경우 바로 양성화.com 상담으로 연결됩니다.
                  </p>
                  <div className="hero-actions">
                    <button className="primary-btn" type="button" onClick={startDiagnosis}>
                      자가진단 시작하기
                    </button>
                    <button className="secondary-btn share-btn" type="button" onClick={shareDiagnosisLink}>
                      <KakaoTalkIcon />
                      자가진단 공유하기
                    </button>
                    {/*
                    <button className="secondary-btn" type="button" onClick={scrollToInfo}>
                      대상 요건 보기
                    </button>
                    */}
                  </div>
                </div>
                <div className="metric-row" aria-label="핵심 조건">
                  <div className="metric">
                    <strong>2023.12.31</strong>
                    <span>이전 사실상 완공</span>
                  </div>
                  <div className="metric">
                    <strong>주거 50%+</strong>
                    <span>주거용 특정건축물</span>
                  </div>
                  <div className="metric">
                    <strong>18개월</strong>
                    <span>시행 후 한시 신청</span>
                  </div>
                </div>
              </article>

              <aside className="side-stack" id="info-section">
                <section className="panel">
                  <div className="panel-title">
                    <h2>먼저 확인할 대상 요건</h2>
                    <span className="pill">법 기준</span>
                  </div>
                  <ul className="check-list">
                    <li>건축허가·신고 없이 지었거나 대수선한 건축물</li>
                    <li>허가·신고는 했지만 사용승인을 받지 못한 건축물</li>
                    <li>용도변경 허가·신고 없이 주택으로 사용 중인 건축물</li>
                    <li>연면적의 50% 이상이 주거용인 건축물</li>
                    <li>다세대·단독·다가구·근린생활시설-&gt;주택 유형에 해당하는 건축물</li>
                  </ul>
                </section>

                <section className="panel">
                  <div className="panel-title">
                    <h3>진단 후 진행 흐름</h3>
                    <span className="pill">Lead Flow</span>
                  </div>
                  <div className="process">
                    <div className="process-step">
                      <b>1</b>
                      <div>
                        <strong>자가진단</strong>
                        <span>면적·완공일·구역·소방 조건 확인</span>
                      </div>
                    </div>
                    <div className="process-step">
                      <b>2</b>
                      <div>
                        <strong>상담 접수</strong>
                        <span>주소와 위반 내용을 남겨 전문가 검토</span>
                      </div>
                    </div>
                    <div className="process-step">
                      <b>3</b>
                      <div>
                        <strong>현장·서류 검토</strong>
                        <span>건축물대장, 토지이용계획, 현장조사</span>
                      </div>
                    </div>
                    <div className="process-step">
                      <b>4</b>
                      <div>
                        <strong>신고 준비</strong>
                        <span>설계도서·현장조사서 작성 및 관할청 신고</span>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="notice">
                  <span>!</span>
                  <span>
                    자가진단은 영업·상담용 1차 필터입니다. 최종 가능 여부는 법 시행령, 지자체 조례,
                    토지이용계획확인서, 건축물 현장조사 결과에 따라 달라질 수 있습니다.
                  </span>
                </div>
              </aside>
            </div>
          </section>

          <section className={`view ${view === 'quiz' ? 'active' : ''}`}>
            <div className="diagnosis-layout">
              <article className="panel quiz-card">
                <div className="quiz-header">
                  <div className="quiz-topline">
                    <span className="pill">{question?.badge || '자가진단'}</span>
                    <div className="progress-meta">
                      <span>{`${Math.min(progress.done + 1, progress.total)} / ${progress.total}`}</span>
                      <span>{progress.percent}%</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.max(6, progress.percent)}%` }} />
                  </div>
                </div>

                <div className="question-body">
                  <div className="question-badge">{question?.badge || 'START'}</div>
                  <h2 className="question-title">{question?.title}</h2>
                  <p className="question-desc">{question?.desc}</p>
                  <div className="hint-box">{question?.hint}</div>
                  <div className={`option-grid ${question?.options.length === 3 ? 'three' : ''}`}>
                    {question?.options.map((option, index) => (
                      <button
                        key={option.id}
                        type="button"
                        className="option-card"
                        data-tone={option.tone || 'yes'}
                        onClick={() => answer(option.id)}
                      >
                        <span className="option-icon">{option.icon || index + 1}</span>
                        <span className="option-content">
                          <strong>{option.label}</strong>
                          <span>{option.detail || ''}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="quiz-footer">
                  <div className="law-ref">근거: {question?.law || '근거 조항'}</div>
                  <div className="footer-actions">
                    <button className="ghost-btn" type="button" onClick={goBack}>
                      이전
                    </button>
                    <button className="danger-btn" type="button" onClick={restart}>
                      처음으로
                    </button>
                  </div>
                </div>
              </article>

              <aside className="panel side-card summary-card">
                <h3>응답 요약</h3>
                <div className={`summary-empty ${history.length > 0 ? 'hidden' : ''}`}>
                  선택한 답변이 여기에 쌓입니다. 애매한 항목은 ‘모름/확인 필요’를 선택해도 상담으로 연결됩니다.
                </div>
                <div className="answer-log">
                  {history.map((item, index) => (
                    <div className="log-item" key={`${item.id}-${index}`}>
                      <span>
                        {String(index + 1).padStart(2, '0')} · {item.law}
                      </span>
                      <strong>{item.typeLabel || item.label}</strong>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </section>

          <section className={`view ${view === 'result' ? 'active' : ''}`}>
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
                  <button className="primary-btn" type="button" onClick={openConsultation}>
                    무료상담 신청하기
                  </button>
                  <button className="secondary-btn share-btn" type="button" onClick={shareDiagnosisLink}>
                    <KakaoTalkIcon />
                    이 자가진단 링크 공유하기
                  </button>
                  <button className="ghost-btn" type="button" onClick={restart}>
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
                  <button className="secondary-btn" type="button" onClick={openConsultation}>
                    무료상담 신청하기
                  </button>
                </div>
              </aside>
            </div>
          </section>
        </main>
      </div>

      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
      <ConsultationModal
        open={isConsultationOpen}
        onClose={() => setConsultationOpen(false)}
        nextPath="/check?consultation=open"
        initialMessage={consultationInitialMessage}
      />
    </div>
  );
}
