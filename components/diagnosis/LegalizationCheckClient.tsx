'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { ConsultationModal } from '@/components/landing/ConsultationModal';
import { LandingView } from '@/components/diagnosis/LandingView';
import { QuizView } from '@/components/diagnosis/QuizView';
import { ResultView } from '@/components/diagnosis/ResultView';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { useKakaoShare } from '@/hooks/useKakaoShare';
import type {
  DiagnosisAnswer,
  DiagnosisHistoryItem,
  PublicDiagnosisQuestion as DiagnosisQuestion,
  DiagnosisResult,
  DiagnosisResponse
} from '@/lib/diagnosis/legalization';

const DIAGNOSIS_SHARE_TITLE = '1분 양성화 자가진단';
const DIAGNOSIS_SHARE_DESCRIPTION = '우리 건물도 특정건축물 특별조치법 대상인지 확인해보세요.';
const DIAGNOSIS_SHARE_ORIGIN = 'https://www.archlegal.co.kr';
const DIAGNOSIS_SHARE_IMAGE_URL = 'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/kakao_b.png';

type View = 'landing' | 'quiz' | 'result';

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
  const [isConsultationOpen, setConsultationOpen] = useState(false);
  const [consultationInitialMessage, setConsultationInitialMessage] = useState('');

  const { kakaoShareEnabled, initializeKakaoSdk, share } = useKakaoShare();

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

  const shareDiagnosisLink = () =>
    share({
      shareUrl: `${DIAGNOSIS_SHARE_ORIGIN}/check`,
      title: DIAGNOSIS_SHARE_TITLE,
      description: DIAGNOSIS_SHARE_DESCRIPTION,
      imageUrl: DIAGNOSIS_SHARE_IMAGE_URL,
      buttonTitle: '자가진단 시작하기',
      webShareText: DIAGNOSIS_SHARE_DESCRIPTION,
      copiedToastMessage: '자가진단 링크가 복사되었습니다.',
      onToast: setToast
    });

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
    <div className="diagnosis-root">
      {kakaoShareEnabled ? (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js"
          strategy="afterInteractive"
          onLoad={initializeKakaoSdk}
        />
      ) : null}
      <div className="app-shell">
        <main>
          <LandingView active={view === 'landing'} onStart={startDiagnosis} onShare={shareDiagnosisLink} />

          <QuizView
            active={view === 'quiz'}
            question={question}
            progress={progress}
            history={history}
            onAnswer={answer}
            onBack={goBack}
            onRestart={restart}
          />

          <ResultView
            active={view === 'result'}
            result={result}
            summary={summary}
            copyText={copyText}
            onConsult={openConsultation}
            onShare={shareDiagnosisLink}
            onRestart={restart}
          />
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
