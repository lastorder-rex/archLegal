import type {
  DiagnosisHistoryItem,
  PublicDiagnosisQuestion as DiagnosisQuestion
} from '@/lib/diagnosis/legalization';

const TYPE_OPTION_IMAGES: Record<string, string> = {
  multi: '/qna3d/bld-1.png',
  single: '/qna3d/bld-2.png',
  dagagu: '/qna3d/bld-3.png',
  near: '/qna3d/bld-4.png'
};

type QuizViewProps = {
  active: boolean;
  question: DiagnosisQuestion | null;
  progress: { done: number; total: number; percent: number };
  history: DiagnosisHistoryItem[];
  onAnswer: (optionId: string) => void;
  onBack: () => void;
  onRestart: () => void;
};

export function QuizView({ active, question, progress, history, onAnswer, onBack, onRestart }: QuizViewProps) {
  return (
    <section className={`view ${active ? 'active' : ''}`}>
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
              {question?.options.map((option, index) => {
                const optionImage = question.id === 'type' ? TYPE_OPTION_IMAGES[option.id] : null;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className="option-card"
                    data-tone={option.tone || 'yes'}
                    onClick={() => onAnswer(option.id)}
                  >
                    {optionImage ? (
                      <span className="option-icon option-icon-image">
                        <img src={optionImage} alt="" aria-hidden="true" />
                      </span>
                    ) : (
                      <span className="option-icon">{option.icon || index + 1}</span>
                    )}
                    <span className="option-content">
                      <strong>{option.label}</strong>
                      <span>{option.detail || ''}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="quiz-footer">
            <div className="law-ref">근거: {question?.law || '근거 조항'}</div>
            <div className="footer-actions">
              <button className="ghost-btn" type="button" onClick={onBack}>
                이전
              </button>
              <button className="danger-btn" type="button" onClick={onRestart}>
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
  );
}
