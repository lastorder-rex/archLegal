import { KakaoTalkIcon } from './parts';

type LandingViewProps = {
  active: boolean;
  onStart: () => void;
  onShare: () => void;
};

export function LandingView({ active, onStart, onShare }: LandingViewProps) {
  return (
    <section className={`view ${active ? 'active' : ''}`}>
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
              <button className="primary-btn" type="button" onClick={onStart}>
                자가진단 시작하기
              </button>
              <button className="secondary-btn share-btn" type="button" onClick={onShare}>
                <KakaoTalkIcon />
                자가진단 공유하기
              </button>
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
  );
}
