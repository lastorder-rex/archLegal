# AGENTS.md — rex 프로젝트 에이전트 공통 가이드

> **모든 AI 코딩 에이전트(Claude Code, GPT Codex 등)의 단일 진입 문서.**
> Claude Code는 `CLAUDE.md`가 이 파일을 import하므로, 프로젝트 규칙이 바뀌면 **이 파일만** 수정한다.
>
> 📌 **작업 시작 전 `docs/PROJECT_STATUS.md`를 먼저 읽어라.** 최근 작업·미push 상태·남은 할일이 거기 있다(계정/기기가 바뀌어도 이어서 작업하기 위함). 작업을 마치면 그 문서를 갱신한다.

## 프로젝트 개요

위반건축물·불법건축물 **양성화 상담/진단 서비스** (운영: `https://www.archlegal.co.kr`, 유입 도메인 `양성화.com`).

- Next.js 14 App Router + TypeScript(strict) + Tailwind + shadcn/ui
- Supabase(백엔드·인증·RLS), 카카오 OAuth, TossPayments 결제, Google Drive 업로드, Telegram 알림
- 핵심 페이지: `/`(랜딩), `/special-act`(특별조치법 해설), `/guide`(가이드 20편), `/check`(1분 자가진단), `/calc`(이행강제금 계산기), `/enforcement-stats`(이행강제금 통계), `/region/[구]`(지역별 현황 25개), `/qna3d`(3D 위반사례), `/map`(위반건축물 지도), `/supercore`(관리자)
- 사업 맥락: 「특정건축물 정리에 관한 특별조치법」(법률 제21820호, **2026.12.17 시행, 18개월 한시**)이 서비스의 법적 기반

## 문서 맵 — 무엇을 어디서 찾나

| 알고 싶은 것 | 문서 |
|---|---|
| **현재 진행 상태·최근 작업·미push·남은 할일** (작업 시작 전 필독) | `docs/PROJECT_STATUS.md` |
| **폴더 구조·파일 위치** (구조 질문은 여기 먼저) | `docs/folder-structure.md` |
| 모듈별 구현 요약 (Auth·상담·진단·계산기·마이페이지·콘텐츠) | `docs/모듈별 상세 개발정의서.md` |
| 특별조치법 **내부 기준 문서** (콘텐츠·로직의 법적 근거) | `docs/legalization-special-act-current.md` |
| 특별조치법 **법령 원문** | `docs/특정건축물_정리에_관한_특별조치법.md` |
| 1분 자가진단 질문/분기/결과 기준 | `docs/legalization-1min-diagnosis-spec.md` |
| 이행강제금 계산기 스펙·기준자료·검증 사례 | `docs/enforcement-fine/` |
| 토스 결제위젯 연동 스펙 | `docs/양성화프로젝트_토스_결제위젯_연동_개발스팩.md` |
| 파일 업로드(드라이브) 프로세스·토큰 규칙 | `docs/upload_process_spec.md` |
| 서울 건축물대장 CSV 임포트(폴백 DB) | `docs/BUILDING_DATA_IMPORT.md` |
| GPT/Claude 커넥터·MCP 설계 (미착수 초안) | `docs/mcp-connector-design.md` |
| 리뷰 산출물 작성 형식 | `docs/codex-review-guidelines.md` |
| 위반건축물 통계 근거(국토부 2025 발표) | `docs/report.md` |
| /qna3d 실사 미니어처 이미지 프롬프트 | `docs/qna3d-photoreal-miniature-prompt.md` |

## 파일 찾기 패턴

- **페이지**: `app/[경로]/page.tsx` — 단, `/qna3d`·`/qna3d-photo`는 `route.ts`가 `kick/*.html` 단독 HTML을 서빙
- **API**: `app/api/[엔드포인트]/route.ts`
- **컴포넌트**: `components/[도메인]/[컴포넌트].tsx` (공용 UI는 `components/ui/`)
- **로직/유틸**: `lib/[도메인]/`, 상수 `lib/constants/`, 검증 스키마 `lib/validations/`
- **가이드 원고**: `content/guide/*.md` (frontmatter+본문, `lib/guide/articles.ts`가 파싱)
- **타입**: `types/`, **훅**: `hooks/`, **DB**: `supabase/migrations/`
- **관리자**: `app/supercore/` (상담 `consultations/`, 결제 `payments/`, 사용자 `users/`)

## 개발 명령

```sh
npm run dev          # 개발 서버 — 포트 3002
npm run build        # 프로덕션 빌드 (prebuild로 kick/*.html → *.min.html terser 압축)
npm run lint         # ESLint
npm run test:unit    # Jest (vitest 병행: test:unit:vitest)
npm run test:e2e     # Playwright (e2e/)
npx supabase db push # 마이그레이션 적용 — ⚠️ 아래 경고 확인
```

> ⚠️ **`npx supabase db push` 임의 실행 금지**: 원격 migration history와 로컬 파일이 어긋나 있어(033~047 구간) 의도치 않은 마이그레이션이 함께 적용될 수 있다. 실행 전 `npx supabase migration list`로 상태를 확인하고 사용자와 합의 후 진행할 것. (2026-06-26 기준)

## 코딩·UI 컨벤션

- 네이밍: 컴포넌트 `PascalCase.tsx`, 유틸 `kebab-case.ts`, 훅 `useCamelCase.ts`, API 폴더 kebab-case + `route.ts`
- **색상은 반드시 테마 토큰으로**: `bg-primary`, `text-muted-foreground` 등 CSS 변수 기반 클래스 사용, hex 하드코딩 금지 (테마: shadcn/ui + TweakCN, 라이트 primary=파랑 / 다크 primary=주홍). 다크모드는 `html.dark` 클래스
- 접근성 WCAG AA(대비·키보드 포커스·aria), 모바일 우선(360px~), 성능 목표 LCP ≤ 2.5s · CLS ≤ 0.1
- **SEO 페이지 공통 체크리스트**: 페이지별 `metadata`(title·description·canonical) + JSON-LD + `SiteHeader`/`SiteFooter` + **`app/sitemap.ts`에 라우트 등록**. 콘텐츠 페이지는 `components/CopyProtection.tsx` 제외 목록 검토
- 법령 관련 문구·수치는 `docs/legalization-special-act-current.md` 기준으로 작성하고 조문을 표기한다. 원문에 없는 수치 창작 금지

## 에이전트 작업 규칙

- 프로그램·설정 변경은 별도 확인 없이 즉시 적용한다(사용자 선호). 단 **git commit/push·파일 삭제·외부 발행은 지시가 있을 때만**
- 작업 검증: `npx tsc --noEmit` + dev 서버(3002) 렌더 확인을 기본으로 한다
- `kick/*.min.html`은 빌드 산출물(gitignore) — 3D 페이지 수정은 원본 `kick/*.html`에
- `.env*` 커밋 금지. `public/naver*.html`(네이버 소유확인)·`public/robots.txt`·`public/llms.txt` 임의 삭제 금지
- 구조 변경 시 `docs/folder-structure.md`를, 모듈 변경 시 `docs/모듈별 상세 개발정의서.md`를 함께 갱신한다

## 위반건축물 데이터 수집 (재사용 절차)

사용자가 "○○구/○○ 추출해줘"처럼 **짧게** 지시하면 긴 설명 없이 바로 이 절차로 진행한다.

- **스크립트:** `scripts/collect-violations.mjs` (rex 루트에서 실행)
- **동작:** VWorld 시군구경계(lt_c_adsigg)에서 대상 시도 구 목록·bbox 자동조회 → 구별 쿼드트리로 `lt_c_bldginfo`(viol_bd_yn=1) 수집 → 법정동명 역지오코딩 → Supabase `public.violation_buildings`에 **pnu 기준 upsert(멱등)**. 이미 적재된 구는 자동 skip, 한 구 실패해도 다음 구 계속.

```sh
node scripts/collect-violations.mjs            # 기본=서울 전 구 (SIDO=11)
ONLY=11680 node scripts/collect-violations.mjs # 특정 구만 (sigungu_cd 5자리, 쉼표로 여러개)
SIDO=41 node scripts/collect-violations.mjs    # 다른 시도 전체 (41=경기)
FORCE=1 ONLY=11680 node ...                    # 이미 적재된 구 강제 재수집
```

- **시도코드:** 11서울 26부산 27대구 28인천 29광주 30대전 31울산 36세종 41경기 42강원 43충북 44충남 45전북 46전남 47경북 48경남 50제주
- **⚠️ 실행 주체:** 운영 Supabase 쓰기가 에이전트 환경에서 차단되므로 **수집 스크립트는 사용자가 직접 터미널에서 실행**한다. 에이전트는 ①정확한 명령 한 줄 제시 ②적재 후 `localhost:3002/map` 브라우저 검증을 담당.
- **상태(2026-06-19):** 서울(SIDO=11) 25개 구 전부 적재 완료(≈37,899건). 서울 재실행 시 전부 skip. 다음 확장 후보는 다른 시도(SIDO 변경).

## 관련 데이터 테이블 (Supabase)

- `violation_buildings` — 위반건축물 등재 현황(서울, pnu 기준). `/map`·`/region` 데이터원
- `enforcement_penalty_annual_stats` — 이행강제금 부과·징수 통계(2021~2025, 서울+25개 구, 유형별). `/enforcement-stats`·`/region` 데이터원
- `enforcement_fine_*` — 계산기 기준자료(시가표준액·지수·잔가율·감경가중) 및 계산 결과
- `users`·`consultations`·결제 관련 테이블 — RLS 적용, 접근은 auth helper 클라이언트로
