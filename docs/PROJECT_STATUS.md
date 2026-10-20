# PROJECT_STATUS — rex 현재 진행 상태·최근 작업·남은 할일

- **2026-10-21 main↔feat 통합 + 네이버 소유확인 파일:** 운영이 feat/violation-map 기준으로 CLI 배포돼 main이 뒤처져 있던 상태를 해소. feat를 main에 병합(4cc9961, 충돌 시 feat 우선, 트리 동일 검증) → origin/main push → Vercel main 자동배포 READY(dpl arch-legal-75t1xxkue) → 운영 /h·/case-room·/·/calc 정상, /map 404는 MAP_ACCESS_KEY 게이트(정상). 이제 **main==feat/violation-map**이며 main push가 곧 운영 배포다(worktree CLI 배포 불필요). 네이버 서치어드바이저 신규 확인 파일 `public/naverbb2230022fe308f1851bcff49d70aa5c.html` 추가(기존 naver487c… 유지).
- **2026-10-02 기기 이동 인수인계(근무시간 자료):** 산정 스크립트·절차는 `disease-case-lab/data/private/heonwoo/attendance-tools/README.md`(Git 제외)에 보관. 다른 기기에서 이어가려면 ①rex 변경 커밋·push 후 pull, ②`.env.local`(PRIVATE_CASE_* 6개 + 개발용 PRIVATE_CASE_LOCAL_DIR) 수동 복사, ③`disease-case-lab/data/private/heonwoo/` 폴더(JSON·manifest·tools)와 `~/Downloads`의 xls·xlsm·결과 xlsx 수동 이동. 운영 사이트는 DB 적재가 끝나 어느 기기에서든 동일하게 보임.
- **2026-10-02 case-room 근무기록 탭(로컬):** /case-room에 '근무기록'·'근무 주별집계' 탭 추가(AttendanceViews.tsx, SOURCE_NAMES에 attendance-2026-h1.json). 데이터는 출입기록 xls(1~6월 114일)+출장 노트북 로그+이동기록을 정리한 JSON(133행, 개인정보 없음), 엑셀(`~/Downloads/명예퇴직 직원 출입기록_날짜별근무시간.xlsx`)과 동일 수치·셀 단위 검산 완료. 7/1 기준 12주 평균 52.4h(환산 53.3h), 휴무 주 제외 A 55.7h·B 57.7h. 1차 출장 5/11~15는 현장근무 추정 9h(사용자 지시). 개발 전용 env PRIVATE_CASE_LOCAL_DIR로 로컬 검토(3002), tsc·jest 10/10·PC/360px 렌더 확인. **운영 반영 완료(사용자 '진행' 지시):** 전용 DB private_case_staging에 attendance-2026-h1.json 적재(row b4f02c9e…, 원본과 deep-equal 검증, manifest 갱신) → HEAD(c907ddf) 기준 임시 worktree에 case-room 변경 6개 파일만 얹어 `vercel deploy --prod`(arch-legal-pkbiqelme, https://www.archlegal.co.kr 별칭) → 운영에서 로그인·두 탭·13주 표 확인. 작업 트리에서 직접 배포는 data/kcomwel 150MB 파일 때문에 100MB 제한에 걸려 실패하므로 worktree 방식 사용. SiteFooter 주소 영문화(미커밋, 출처 불명)는 이번 배포에서 제외. Git 커밋은 미실행. 미확정: 1차 출장 9h 추정 근거, 6/3 23:46, 노트북 시간대, 출장 탭과의 수치 정합.
- **2026-09-16 누적 수정 운영 배포 완료:** 사용자 승인 후 feat/violation-map f8842dd, Vercel dpl_6dhoQmP1VSKkaHwSHtQaGFqMmXAF READY. 실도메인에서 요청 문구 삭제/문진표 확인사항 제거/원래 표 형식/119 간격7px 검증. 자료7개·모바일·검색·로그인 보호·로그아웃 통과. 접속 https://www.archlegal.co.kr/h. 향후 배포는 별도 사용자 승인 필요.

- 2026-09-16: User authorized bundled deployment. feat/violation-map f8842dd pushed; Vercel production build in progress. Includes prior travel-copy removal plus questionnaire/checkup/ER text edits, compact timeline, original tables.

- 2026-09-16: Reverted mobile cards at user request; restored original shared table renderer and horizontal-scroll mobile tables. Retained requested text removals and compact ambulance timeline. Local only; no deployment.

- 2026-09-16: Compacted mobile cards: removed redundant heading label, inline labels/values, reduced padding and grid/list gaps. Local only; no deployment.

- 2026-09-16: Added mobile record cards (<=600px) for diagnosis, ambulance measurements/treatments, emergency fields, hospital visits and travel routes/night calculations. Desktop and comparison tables retained. All fields share the same rows; no data edits. Local only, no deployment. Type/lint passed; all seven tabs at 360/390/430/1100px checked, table/card values match and filtered hospital cards verified.

- 2026-09-16: Removed questionnaire subtitle requested by user. Local only; no deployment.

- 2026-09-16: Removed requested historical-checkup recommendation disclaimer from checkup notes shown in the UI. Local only; deployment remains on hold.

- 2026-09-16: Removed requested explanatory paragraph beneath emergency-record table. Local edit only; no commit, push or deployment. Deployment requires explicit user permission.

- 2026-09-16: Compacted ambulance timeline rows: vertical padding 14px→7px, removed inter-row margin, reduced source-note spacing and line height. Local only; deployment remains on hold.

- **2026-09-16 배포 보류 지시:** 사용자 요청으로 건강검진 문진표의 자료 확인사항 전체를 화면에서 제거. 로컬 수정만 수행, commit/push/추가 배포 하지 않음. 이후 배포는 사용자 지시에 따라 일괄 수행. 앞서 시작된 출장 문구 삭제 운영 배포 dpl_367qXoCKrzSZv4UYn6foTkg1JEVn은 BUILDING 상태에서 취소 API 200 확인. 운영은 앞선 /h 배포 상태 유지.

- 2026-09-16: Removed four requested explanatory sentences from the travel view. Retained remaining notes, source records and travel figures.

- **2026-09-16 단축 주소 운영 배포:** feat/violation-map 18bfbc9, Vercel dpl_29owjQ2JqqSbq5XgA6qLL2pSzNdj READY. https://www.archlegal.co.kr/h → /case-room (307). 타입 및 로컬 이동 검사 통과.

- 2026-09-16: Added /h short URL redirect to /case-room in next.config.mjs. Existing password protection remains at the destination.

- **2026-09-16 운영 배포 완료:** feat/violation-map 커밋 302e21f 기준 Vercel CLI 운영 배포 dpl_E1ZAaJbRVNiJ6R993QkWW9WrmUpa READY, https://www.archlegal.co.kr/case-room 연결. 실도메인에서 제목 성 제외, 7개 문서, PC·360px 모든 탭, 검색, 미인증401/교차origin403/Secure·HttpOnly·Strict 쿠키/no-store/로그아웃401 검증 통과. main 변경 없음. Vercel Git 자동 배포 productionBranch 설정은 기존 main이며 이번에는 지정 브랜치에서 CLI --prod 수행. 기존 CLI47.1.4는 API 버전 차단으로 npx vercel@latest(59.18.0) 사용. 개인정보·원문 비밀번호는 공개 Git에 없음.

- **2026-09-16 배포 기준 변경:** 사용자 지시로 feat/violation-map(bbd7473) 기준 자료실 커밋 302e21f push. 상단 제목에서 성 제외. 기존 main 기준 PR #11 병합 없이 닫음. 운영 CLI 배포 진행 중. 로컬 브랜치도 원격 커밋으로 동기화하되 미커밋 파일 내용은 전부 보존.

- **2026-09-16 자료실 DB/배포 준비:** 사용자 명시 승인으로 전용 private_case_staging 정리 JSON 7개 저장·원본 일치·RLS 및 anon/authenticated 차단 검증. Vercel arch-legal 운영 환경변수 6개 등록. 운영 main(38d5592) 기준 분리 체크아웃에서 자료실만 반영, 타입/lint/보안10 통과. 기능 브랜치 feat/private-case-room 커밋 0a9dde1, PR https://github.com/lastorder-rex/archLegal/pull/11 생성. Vercel Preview 배포 빌드 통과, 실제 DB 7개 연결 PC·360px/전체 탭/검색/로그아웃 재검증 통과. 자동 승인 검토가 main 직접 push를 차단하여 운영 병합·배포는 아직 대기 중. 개인정보·환경변수·기존 개인 작업일지는 공개 커밋 제외. 배포 체크아웃 /private/tmp/rex-case-room-deploy.

- **2026-09-16 비공개 자료실 로컬 구현:** /case-room 및 /api/private-case 로그인·자료조회·로그아웃 추가. 사용자 지정 비밀번호는 로컬 bcrypt 해시만 저장, 전용 DB의 기존 자료 4개만 조회. 새 의료자료 업로드 없음. 8시간 서명 세션/허용 origin/HttpOnly·운영 Secure/로그인 15분15회 제한. 전용 DB에 의료정보 없는 limiter SQL만 적용. 보안 단위10/타입/lint·실제 로그인/PC·모바일·검색·로그아웃 검증. 실제자료 하드코딩 없음, 사이트 메뉴·sitemap 제외. Git commit/push·Vercel 환경변수·배포 미실행. docs/PRIVATE_CASE_PORTAL.md 참조.

- 2026-09-16: Added private travel-records JSON and travel tab from authorized Drive XLSM sheet rows22-62. Preserved flights, source cells and assumptions; verified elapsed/night arithmetic. Four main legs 68h09m; pre-trip leg separate; worktime recognition and cited precedents unverified. Local only, no DB transfer or macro execution.

- 2026-09-16: Changed private review palette from navy to vivid blue per user preference; neutral body text and pale blue surfaces. Content/layout unchanged.

- 2026-09-16: Refined private review styling only: navy hierarchy, readable table rows, profile strip, clearer selected navigation and source notes, responsive two-column mobile navigation. Verified 6 menus, 3 years, 140 records/search, desktop/mobile light/dark. No data/DB changes.

- 2026-09-16: Reordered private review navigation: diagnosis, ambulance, emergency, checkup summary, questionnaire, annual hospital records. Renamed history tab/title per user request. Local HTML only.

- 2026-09-16: Added health-checkup summary to localhost:3005 private review. 2025 user summary (8 findings) and 2024/2022 supplied Markdown reports (28 rows each), selectable years, original recommendations and source limitations preserved. Saved private health-checkup-results.json; no DB upload. Browser desktop/mobile and prior record views verified.

- 2026-09-15: Added emergency-record section to private review HTML and regenerated localhost:3005 page. Supabase ER upload was rejected by automatic approval review pending explicit authorization for the new sensitive payload; no remote write performed.

- 2026-09-15: Saved user-pasted ER excerpt in private emergency-record JSON and linked baseline. Preserved timing differences vs ambulance record and unlabelled vitals; PDF unverified. Supabase/HTML not updated.

- **2026-09-15 개인자료 열람 미리보기:** Git 제외 개인자료 폴더 heonwoo-case-review.html에 정리 JSON 4개를 이용한 대화 내 열람 화면 생성. 문서별 진단/이송 경과/문진표/140행 진료 내역·검색 제공. PC·360px, 검색/빈 결과/140행 검증 완료. 원격 DB 변경·공개 배포 없음.

- **2026-09-11 비공개 임시 DB 저장:** 전용 Supabase public.private_case_staging에 기존 정리 JSON 4개 저장·원본 일치 검증 완료. RLS 강제/anon·authenticated 조회 거부 확인. 개인 manifest Git 제외. 수동 SQL만 적용, db push·웹 연결·추가 Git push 없음.

- **2026-09-11 GitHub 공개 업로드:** 사용자 지시로 lastorder-rex/nunu 생성, main 첫 커밋 push 완료. 의료자료·환경변수·개인 작업일지 제외, 공개 문서 OC 값 제거. 타입/lint/단위20/빌드 통과. Vercel 배포는 아직 미실행.

- **2026-09-11 기본진료 정리:** 사용자 제공 13쪽 PDF의 140개 청구 내역을 private 기본진료 JSON에 출처·연도별 합계와 함께 저장하고 baseline 연결. 순번/비용 검증 완료. 진단명 미기재 유지, 원격·웹 변경 없음.

- **2026-09-11 구급기록 정리:** 사용자 제공 PDF 2쪽 육안 대조. 비공개 기초자료에 신고·이송 경과, 측정값, 처치·서술 출처 연결. 수액량/문서 날짜 차이 보존. 원격·웹 변경 없음.

- **2026-09-11 개인 문진표 정리:** 사용자 지정 2022·2024 비교 엑셀 14항목/28응답을 private 건강문진 JSON에 출처 셀과 함께 보관하고 baseline에 연결. 원본 PDF 미대조, 공란/아니요 구분. 원격 수정·웹 노출 없음.

> 이 문서는 **세션·계정·기기가 바뀌어도 이어서 작업**할 수 있게 현재 상태를 남기는 살아있는 문서다.
> 새 작업을 시작하는 AI 에이전트(Claude Code / GPT Codex 등)는 여기부터 읽고, 작업 후 갱신한다.
> 최종 갱신: **2026-09-11**

## 업무상질병 사례연구 독립 프로토타입 구현 (2026-09-10, Codex)

- **2026-09-11 개인 기초자료 추출:** 사용자 지정 공유드라이브 의료문서3개(5쪽) 확인 및 진단서 독립 대조. 독립 앱 Git 제외 data/private/heonwoo/baseline.json에 문서별 출처/진단코드/의증/미상날짜 보존. 원격파일·DB 변경 및 웹 노출 없음.

- **2026-09-11 Drive 연결 점검:** 사용자 지시로 rex .env.local의 GOOGLE_SERVICE_KEY/GOOGLE_SHARED_DRIVE_ID/GOOGLE_ROOT_FOLDER_ID 설정 및 실제 읽기 인증 확인. 공유드라이브 양성화_업무공유드라이브·지정 Drive 폴더 메타데이터 조회 성공. 원격 파일/권한/환경설정 변경 없음, 쓰기 동작 미검증.

- **2026-09-11:** 사용자 요청으로 독립 앱 검색 상단 “실제 원문을 검색하고 판단 이유를 비교합니다…” 안내 문구 제거.

- **2026-09-11 헤더 집계 UI:** 독립 앱에 인정 경향 집계 Dialog 추가(2742건, 3구간91.7/63.9/18.3%, 인정·일부인정 비율). 분석일/잠정/검색과무관/실시간아님 및 제외기준 명시. 단위20/브라우저9/타입/lint/빌드·PC/모바일 확인.

- **2026-09-11 인정 경향 분석:** 서브에이전트3개 병렬검토, 실제11,718건 중 오류31건 제외·결과확인가능2,742건 잠정집계. >60시간 인정+일부91.67%,52초과~60이하63.93%,52이하18.34%. 전체확률 일반화금지. 고시간불인정38건 판단문 검토·공식기준 대조. 독립앱 docs/RECOGNITION_ANALYSIS_2026-09-11.md. 앱 미초과/대리인주장 등 추가추출오류 발견, 이번집계에서제외했으나 앱수정은 후속.

- **2026-09-11 근무시간 v3 정정:** 조사/판단 숫자 반복 조건 폐기. 조사만 있어도 출처와 함께 상단·비교 표시. 240020170001023의 43시간/42시간37분/37시간2분 실API·화면 확인, 단위19/브라우저8/타입/lint/빌드 통과.

- **2026-09-11 근무시간 수정:** 독립 앱 hours-v2로 사실·주장·기준 분리, 조사/판단 일치·충돌 없음만 대표값. 상세 API 원문 재계산으로 기존 데이터 즉시 적용, 64/60 기준 오선택 해결. 원문/DB 과거 이력 보존. 18,185건 인용 위치 자동 검증·실제 표본/화면 확인·단위18/브라우저8/타입/lint/빌드 통과. 상세는 독립 앱 docs/HOURS_EXTRACTION.md.

- **2026-09-11 비교 UI:** 독립 앱 비교 화면 목록 복귀·선택 초기화 추가, 2건 미만이면 자동 복귀. 검색어 유지/초기화/모바일 브라우저 회귀 통과.

- **2026-09-11:** 사용자 요청으로 독립 앱 상단 가상 자료 데모 링크 제거.

- **2026-09-11 디자인:** 독립 앱 실제 자료 화면 네이비/골드 헤더·블루 강조·흰색 검색/원문 패널·선택 상태 개선. PC/360px 확인, 타입/lint/단위12/빌드/회귀7 통과. rex 운영 변경 없음.

- **2026-09-11 상세 UI:** 독립 앱 관련 자료를 원문 아래로 이동, 3건+더보기/접기, 기관·사건번호 표시. 기존 AI 보관 안내 문구 제거. 타입/lint/단위12/빌드/회귀7 통과, 저장한 실제 DB 응답으로 UI/모바일 확인. 실시간 검색은 DB 57014 시간 초과 확인(후속 점검). 기존 근무시간 기준 혼동 오류는 미수정. rex 운영 코드·DB 변경 없음.

- **최신 API 정상화·대량 적재 완료(2026-09-11):** 사용자 성공 예제의 OC는 `justrex`로 기존 `jestrex`와 한 글자 달랐음. 독립 앱 `.env.local` 수정 후 HTTPS 목록/본문 정상화, IP·도메인 재등록 불필요. 근로복지공단산재판례의 6개 질병 키워드 전체 목록에서 고유 **6,464건 API 본문 적재**, 실패0·ID/원문 버전 전수 일치. 기존 공개 판례와 중복 정리 후 **판례 원문6,467 + 질병판정서11,718 = 전체18,185건**. 판례 검색 표시5,950건, 자동 관련성 보류517건도 DB 보관. 실제 필터·원문·비교·질병판정서 연결/모바일 확인, 단위12/회귀7/타입/lint/빌드 통과. 이전 인증 미해결 기록은 모두 해결 전 이력. 재개는 독립 앱 `npm run data:court -- --apply --cached-index`. rex 운영 DB·배포·커밋·push 변경 없음.
- **2026-09-11 판례 추가:** 승인된 OC `jestrex`를 공식 명세대로 HTTPS JSON/XML 목록·본문·공식 호스트별 검사했으나 서버 사용자 검증 실패 지속(미승인 또는 IP 누락으로 단정하지 않음). 공개 국가법령정보센터 원문은 정상 접근되어 **선별한 판례 14건 실제 적재**, 총 **11,732건**. `/Users/kbsc/disease-case-lab`에 공개 판례 수집기·파서·출처/사건번호/주문 표시 추가. 실DB 버전 14개 대조·법원판례 필터14건·관련 질병판정서8건·비교/모바일 확인. 단위11개/타입/lint/빌드/브라우저7개 통과. API 인증 문제 자체는 아직 미해결이며 새 `docs/LAW_API_STATUS.md`에 명확히 기록. rex DB 변경·배포·커밋·push 없음.
- **최신 완료 상태:** 전용 Supabase 연결 복구 후 남은 4,393건을 재개하여 **실제 질병판정서 11,718건 전체 적재 완료**. 원본 ID/현재 원문 버전 11,718개 전수 일치, 뇌혈관 8,799·심장 2,919 및 건축·엔지니어링 120/업종 87건 확인. localhost:3003 실제 검색·원문·관련 자료·비교 선택 및 모바일 가로 넘침 없음 검증. 이전 7,325건 중단은 해결됨. 사용자 SQL 재실행 불필요. 다음은 실제 화면 검토 및 법제처 OC 등록 IP·도메인 설정 해결(판례 아직 0건).
- 후속 실행: 사용자가 SQL 실행 후 전용 DB 테이블 생성 성공 확인. **7,325/11,718건 실제 적재 확인**, 이후 Supabase DB 연결 거부(REST 503/PGRST002, 직접 풀러 57P03)로 중단. 원인은 아직 확인되지 않았으며 사용자에게 대시보드 안내 확인 요청. 7,325건 체크포인트 유지·제한적 재시도 구현/타입/lint 통과. 복구 후 독립 프로젝트에서 `npm run data:import` 재실행해 남은 4,393건과 전체 검증 진행. SQL 재실행은 필요 없음.
- 최신 구현: `/Users/kbsc/disease-case-lab`에 질병판정서·법원 판례 공통 6개 테이블 SQL, 배치 적재/법제처 수집 스크립트, 실DB 검색·원문·관련 자료·비교 화면 추가. 전용 Supabase `itlakmeggyvdwjzasewn` 생성(서울); rex 운영 DB 변경 없음. 사용자가 SQL Editor에서 직접 테이블을 생성하기로 했으며 **원격 스키마·실데이터 적재는 아직 미완료**.
- 실제 11,718건 적재 파일 준비 및 문단 위치 검사 완료(뇌혈관 8,799/심장 2,919, 문단 98,796, 기존 AI 87건 미검토 분리). 120/87건은 부분집합 태그로 연결. SQL 로컬 PostgreSQL 재실행·권한·근거 검증, 단위 9개·타입/lint/빌드·브라우저 7개 검증 통과. 상세 설치 안내는 독립 프로젝트 `docs/DATABASE_SETUP.md`.
- 법제처 HTTPS 요청은 OC 등록 IP·도메인 검증 실패 응답. 실제 판례 적재는 0건이며 설정 해결 후 수집 필요. 새 `/`는 실제 DB 전용, 가상 자료는 `/demo`로 이동. 배포·커밋·push 없음. 아래 항목은 이전 검토 이력.
- 기존 실자료 우선 활용으로 순서 수정(사용자 지적 후 파일 직접 확인): 질병판정서 원본 **11,718건/고유 accnum 11,718개**, 건축·엔지니어링 사례 **120건**, 업종 한정 판정서 **87건**, 판정기준 추출 **87건** 존재. 120건은 전체 원본의 부분집합이며 87건은 120건에 포함, 추출 87건은 업종 원본과 accnum 전부 일치. 중복 합산하지 않음. 원본 1건은 noncontent 공란.
- 제안 순서: 기존 원본 Supabase 적재·검색 → 건축·엔지니어링 120건 우선 활용 및 추출 87건 원문 대조·근거 연결 → 질병판정 API 갱신/확장 → 법제처 법원판례 추가. 기존 시간기준_충족 값은 자동 인정 기준으로 재사용하지 않음. 이번 확인에서는 원본/앱/DB 변경·API 호출 없이 파일 건수·구조·ID 관계만 검증.
- 저장 방식 후속 검토: 실제 자료 축적·공유 목적에 맞춰 로컬 파일 우선 제안에서 **실데이터 수집부터 별도 Supabase 프로젝트에 저장**하는 방향으로 권고 수정. 원문·사례 정보, 근거 연결 추출 결과, 수집 이력을 관리하고 로그인 없는 조회/서버 전용 수집 쓰기를 분리. 실제 DB 생성·연결·변경은 아직 미실시.
- 후속 요청: 사용자가 실제 법원판례 기반 데이터 전환 계획을 요청. 공식 판례 목록·본문 API 명세를 확인했으며, OC 확인 → 뇌·심혈관 관련 후보 수집·중복 정리 → 원문 기반 관련성·판단/증빙 추출 → 실제 자료 화면 연결 → 수집 확대 및 별도 저장소/배포 순서 제안. 이 검토에서는 실제 API 호출·데이터 수집·앱 코드 변경을 수행하지 않음.
- 최신 사용자 결정: 로그인·초대 없이 주소를 아는 사람이 사용하는 방식. 첫 단계는 가상 사례 기반 로컬 앱.
- rex 밖 `/Users/kbsc/disease-case-lab`에 독립 Next.js 프로젝트 생성. 실행 포트 **3003**, 이 프로젝트의 README·AGENTS.md·docs/PROJECT_STATUS.md에서 후속 작업 관리.
- 가상 사례 10건 검색·필터·상세 근거 원문·2~3건 비교·가상 내 사건·관심 사례/메모/증빙 브라우저 저장 구현. PC 3열·모바일 대화상자 지원.
- 최신 전달 OC는 새 프로젝트 `.env.local`의 `LAW_API_OC`로 설정. 실제 API 호출·키 유효성 검증은 후속 범위. rex `.env.local` 및 운영 DB 변경 없음.
- 검증: 타입 검사·린트·빌드 통과, 단위 테스트 8개·Chromium 브라우저 테스트 5개 통과. 1512px PC 및 360px 모바일 화면 시각 검토.
- 커밋·push·외부 배포·DNS 변경 미실시. 기존 질병판정서 실자료는 새 앱에 복사하지 않음.

## 업무상질병 사례연구 프로젝트 분리 검토 (2026-09-10, Codex)

- 사용자 요청에 따라 첨부 요구사항과 rex 구성 검토만 수행. 신규 앱 생성·DB 변경·배포 미실시.
- 권고(사용자 결정 전): 형제 폴더 `../disease-case-lab`에 독립 앱·Git 저장소, 기존 Vercel 계정에 별도 프로젝트. 주소는 `cases.archlegal.co.kr` 또는 `*.vercel.app` 활용.
- 근거: rex 전역 인증·브랜딩 및 하위 TS 파일 검사와의 결합 방지. 기존 질병판정서 자료는 후속 연결 때 재사용 검토, 1차는 가상 자료만 사용.
- 단계 권고: 로컬 샘플 프로토타입 → 별도 Supabase 프로젝트의 초대 사용자 인증·서버 권한 검사·RLS → 제한 공유 및 실제 API 연계. GitHub Pages는 정적 호스팅이며 기본 무료 구성에 사이트 비공개 접근 제어가 없어 비추천.
- 실제 Vercel/Supabase 플랜·잔여 한도·DNS 설정은 미확인. 무료 운영 여부는 사용 목적과 계정 조건 확인 필요.

## 리팩토링 필요성 검토 (2026-09-10, Codex)

- 현재 작업 트리 기준 읽기 전용 소스 검토. 애플리케이션 코드 변경 없음. 전면 재분해는 보류 권고.
- 소규모 후보: 계산기 `PreparedData`/`calculationBasis`의 명시적 타입 보강, 중복 주소 검증 스키마·날짜 상수 재사용. 관리자 폼/모달 분리는 해당 화면 변경 필요가 생길 때만 권고.
- 계산기 엔진·결제 위젯·Drive 업로드의 구조 변경은 회귀 검증 확보 전 보류. 계산 엔진 직접 단위 테스트는 현재 테스트 파일 검색에서 확인하지 못함.
- 별도 정합성 검토 필요: `app/api/payments/confirm/route.ts`는 Toss 승인 호출 후 내부 단계 소유자·금액·기결제 여부를 검증함. 승인 성공 후 내부 검증 실패 시 DB 미반영 가능 경로를 정적으로 확인(실결제 재현 미실시). 단순 리팩토링과 분리해 다룰 것.
- 검증: `npx tsc --noEmit --incremental false` 통과. 브라우저·외부 결제·DB 쓰기 검증 미실시.

---

## ⚠️ 저장소 상태 (중요)

- 작업 브랜치 `feat/violation-map`. **최근 대량 작업이 전부 로컬 커밋만 되어 있고 아직 `git push` 안 함** (origin/main 대비 90+커밋 대기).
- 배포(Vercel)는 아직 이 작업들을 반영하지 않음. push·머지 전까지 운영 무영향.
- **배포 시 필요한 환경변수**: `MAP_ACCESS_KEY`(위반지도 접근키)를 Vercel에 추가해야 `/map` 게이트가 운영에서 동작. `CRON_SECRET`은 파기배치 cron 켤 때만(현재 불필요).

---

## 부수 데이터 작업 (2026-09-03, 미커밋) — 근로복지공단 질병판정서 수집

- rex 서비스와 무관한 별도 데이터 작업. 공공데이터포털 「근로복지공단_질병판정서 조회 서비스」(data.go.kr 15110836)에서 **뇌혈관질환 8,799 + 심장질환 2,919 = 11,718건** 판정서 전문 수집.
- 스크립트 `scripts/collect-kcomwel-disease.mjs`(의존성 없음). 인증키는 `.env.local`의 `FOR_THE_HUGH`(또는 `DATA_GO_KR_SERVICE_KEY`).
- 산출물 `data/kcomwel/cerebro_cardio_decisions_2026-09-03.{json,csv}`(각 ~160MB, **gitignore됨**) + `.summary.json`(심의결과·직종·업종 집계) + `codes.json`(심의결과 6·직종 243·질병구분 21 코드표).
- 필드: accnum(사건번호, 2016~2021)·kinda(심의결과)·kindb(직종)·kindc(질병구분)·title(업종)·noncontent(판정서 전문, 중앙값 5,600자, "주문/청구취지/신청내용/…/인정사실" 섹션 구조).
- **업종 추출 + 엑셀**: '건축기술, 엔지니어링 및 관련기술서비스업'(데이터상 쉼표가 `||`로 저장됨) 87건 → `data/kcomwel/건축기술_엔지니어링업_뇌심혈관_판정서.xlsx`(집계 시트 + 목록 시트 + 사건별 상세 시트 87개, 시트 간 하이퍼링크).
- **구글드라이브 제한 공유**: `scripts/drive-share-file.mjs`(서비스 계정, 상담 업로드와 동일 인증)로 공유드라이브 `양성화_업무공유드라이브` 최상위에 폴더 `산재_뇌심혈관_질병판정서(승인자만)` 생성, xlsx + 구글시트 변환본 업로드. 최초 폴더(ID 19s_7c2…)는 사용자가 이동/삭제해 서비스 계정 범위에서 사라짐 → 2026-09-03 재생성 **ID `1JrchihlMI9a-K3gNS11x7erbLimSf_3g`**. 엑셀에 '기준요약'(승인기준 통계)·'판정기준'(사건별 AI 추출: 12주/4주/1주 시간·가중요인·기저질환·핵심사유) 시트 추가(총 91시트). 추출 원본 `data/kcomwel/건축기술_엔지니어링업_판정기준_추출.json`. 폴더 권한은 드라이브 멤버(rex@archlegal.co.kr 등)만 — 승인자 이메일은 `--share a@x.com` 으로 추가.
- 주의: 원본에 고인 실명이 가려지지 않은 건 1건(240020180000811) 있음. 외부 공유 시 확인.

---

## 최근 완료 작업 (2026-07, 로컬 커밋)

### 0. `/qna3d` Retina·모바일 3D 프레이밍 수정 (2026-07-09)
- DPR=2/3 화면에서 WebGL canvas가 CSS 표시 크기보다 2배 커져 건물과 CSS2D 번호 핀이 어긋나던 문제 수정.
- `kick/qna3d.html`의 `#gl`에 명시적 `width/height:100%` 적용, resize마다 `renderer.setPixelRatio()` 재동기화.
- 기존 화면비 기반 거리 보정 대신 건물 모델 바운딩 스피어와 카메라 FOV 기준으로 첫 화면 프레이밍 계산.
- 초기 로딩 프레이밍은 데스크톱·노트북 5% 줌인, 모바일은 핀 잘림 방지를 위해 3% 줌인 적용.
- 전면 보도블록·경계석은 원래 있던 흰색/베이지 톤을 유지.
- 검증: DPR=2 MacBook Pro 크기(1512×982), DPR=1 1920×1080, 모바일 DPR=3 390×844에서 canvas/label 크기 일치 및 가로 스크롤 없음 확인. `npx tsc --noEmit` 통과.

### 1. `/special-act` 모바일 레이아웃 수정 (2026-07-09)
- 모바일 목차 가로 스크롤 리스트가 부모 grid 최소폭을 밀어 문서 폭이 360px → 1230px로 커지던 문제 수정.
- `app/special-act/page.tsx`의 본문 grid/aside와 `components/special-act/TocSidebar.tsx`의 nav wrapper에 `min-w-0` 적용.
- 검증: 360px 모바일 뷰포트에서 `document.documentElement.scrollWidth === clientWidth` 확인, `npx tsc --noEmit` 통과.

### 2. 대규모 리팩토링 (동작·UI 완전 보존 원칙, 매 단계 tsc 0)
- **관리자 영역**(supercore + api/admin): 중복 UI·헬퍼 추출, 인증훅 통일, 타입 통합(types/admin.ts), lib/admin/ 이동, 포매터/테이블 공용화. + 보안: 약한 인증 라우트 9개 → `verifyAdminSession` 통일. + 위반지도 `/map` 404 게이트(접근키). + 상담 상세에 주소기반 위반건축물 자동표시.
- **비관리자 로직 페이지**: 이행강제금 계산기 **2,055→435줄 셸+훅+뷰9**, 업로드 586→73줄, 상담내역 692→353, 자가진단 655→331. 공용화: `lib/auth/require-session`·`user-profile`, `hooks/useKakaoShare`, `lib/enforcement-fine/calculator-*`.
- **마이페이지 통일**: `/request/history` 상세가 `MyPageShell`(3탭) 재사용, 크롬 중복 제거.
- 검증: tsc 0, jest 통과, /calc·/check 스크린샷 전후 바이트 동일.
- 참고: `app/calc2`가 계산기 제2 소비자(시그니처 변경 주의). `lib/enforcement-fine`·`lib/diagnosis`는 API 라우트 계약 근간(개명 금지).

### 3. 개인정보 컴플라이언스 (개인정보보호법/전자상거래법)
- **카카오 만14세 게이트**: 콜백에서 카카오 생년(필수동의라 항상 제공)으로 만14세 미만이면 users 저장 전 차단+auth계정 삭제.
- **개인정보 로그 제거**, **처리방침 위탁사 명시**(Supabase·Kakao·TossPayments·Google, 텔레그램은 관리자전용이라 제외).
- **보존기간 만료 파기 배치**: `lib/privacy/purge-expired-pii.ts` + `POST /api/admin/tasks/purge-expired-pii`. migration 049(users.legal_hold·anonymized_at) **적용됨**. 대상=결제탈퇴자+마지막결제 5년경과+legal_hold=false, **익명화만(하드삭제X, 거래 금액·일자 유지)**, **dry-run 기본**. **현재 파기 대상 0건**(신규 서비스).

---

## 남은 할일

### 진행중/보류
- **파기배치 활성화**(데이터 쌓여 대상 생길 때만): CRON_SECRET 설정 → Vercel cron 월1회(dry-run 리포트) → 승인 후 `?dryRun=0`. 분쟁/소송건은 `users.legal_hold=true`로 관리자가 수동 제외.
- **개인정보 유출 대응 SOP 문서**(72시간 신고 기준·담당자 체크리스트) — 회사정보 필요, 미착수.
- **관리자 3단계 파일분해**(admins/page 855줄 등) — 미착수.
- **탈퇴 즉시처리 방침**: 무결제=완전삭제(현행 유지), 결제=유지하다 파기배치가 처리(현행 유지). 즉시 마스킹은 분쟁대응 위해 안 함.

### 컴플라이언스 무관/해당없음
- 위치정보(geolocation 미사용), 주민번호(수집 안 함), 사용자향 광고발송(기능 없음).

---

## 재사용 참고
- 리팩토링 표준 절차: `docs/리팩토링-작업지시.md` (Claude Code에선 `/리팩토링` 커맨드).
- 마케팅 콘텐츠(카페30·블로그20): `marketing-content/`, 카페 자동발행 `scripts/publish-cafe.mjs`(네이버 카페 API 이중인코딩 해법 적용).
