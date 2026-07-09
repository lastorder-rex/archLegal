# PROJECT_STATUS — rex 현재 진행 상태·최근 작업·남은 할일

> 이 문서는 **세션·계정·기기가 바뀌어도 이어서 작업**할 수 있게 현재 상태를 남기는 살아있는 문서다.
> 새 작업을 시작하는 AI 에이전트(Claude Code / GPT Codex 등)는 여기부터 읽고, 작업 후 갱신한다.
> 최종 갱신: **2026-07-09**

---

## ⚠️ 저장소 상태 (중요)

- 작업 브랜치 `feat/violation-map`. **최근 대량 작업이 전부 로컬 커밋만 되어 있고 아직 `git push` 안 함** (origin/main 대비 90+커밋 대기).
- 배포(Vercel)는 아직 이 작업들을 반영하지 않음. push·머지 전까지 운영 무영향.
- **배포 시 필요한 환경변수**: `MAP_ACCESS_KEY`(위반지도 접근키)를 Vercel에 추가해야 `/map` 게이트가 운영에서 동작. `CRON_SECRET`은 파기배치 cron 켤 때만(현재 불필요).

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
