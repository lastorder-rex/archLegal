# Rex - 프로젝트 폴더 구조 상세 가이드

## 프로젝트 개요
Next.js 14 기반의 법률 상담 관리 시스템 (App Router 사용)
- TypeScript로 작성
- Supabase를 백엔드 및 인증 시스템으로 사용
- Google Drive API를 통한 파일 관리
- TossPay 결제 시스템 연동
- Telegram Bot API 통합
- `양성화.com` 유입/SEO 브랜딩, 1분 양성화 자가진단, 이행강제금 계산기, 카드뉴스 정적/동적 페이지 운영

---

## 최근 배포 반영 사항 (2026-06-12 기준)
- **양성화.com 브랜딩/SEO 메타**: `app/layout.tsx`, `app/(marketing)/*/page.tsx`, `components/layout/SiteFooter.tsx`
  - 전역 title/description/OG/Twitter 메타에 `양성화.com`, `양성화닷컴`, 위반건축물·불법건축물 양성화 문구 반영
  - 푸터에 `양성화.com` 연결 안내 문구 추가
- **1분 양성화 자가진단**: `app/check/page.tsx`, `components/diagnosis/LegalizationCheckClient.tsx`
  - Next App Router 페이지와 클라이언트 컴포넌트로 구성
  - 메타 description/OG/title 정리
  - 복사/붙여넣기/드래그 선택 방지 스크립트 적용
  - favicon 경로: `public/docu/archlegal-fa.ico`, `public/docu/archlegal-fa-p-transparent.png`
- **이행강제금 계산기**: `app/calc/page.tsx`, `components/enforcement-fine/EnforcementFineCalculatorClient.tsx`
  - 로그인 필수 계산기 화면과 카카오 공유/상담 전환 흐름 구성
  - `/api/enforcement-fine/prepare`, `/api/enforcement-fine/calculate`, 옵션 API로 기준자료 조회와 계산 수행
  - `lib/enforcement-fine/prepare.ts`, `lib/enforcement-fine/calculate.ts`에서 외부 API 매핑과 계산식 분리
  - `/enforcement-fine`은 `/calc`로 리다이렉트
- **이행강제금 기준자료 DB**: `supabase/migrations/033_create_enforcement_fine_tables.sql` ~ `044_seed_additional_reduction_special_conditions.sql`
  - 2026 시가표준액 기준가격, 구조지수, 용도지수, 위치지수, 잔가율, 위반유형, 감경/가중 조건 관리
  - 계산 결과와 산출근거는 `enforcement_fine_estimates`에 사용자별로 저장
- **랜딩 CTA/사이트맵**: `components/landing/LandingPage.tsx`, `public/sitemap.xml`
  - 랜딩 상단에 `/check`와 동일한 새 탭 패턴으로 `/calc` CTA 추가
  - sitemap에 `/calc` 대표 URL 추가
- **자가진단 공개 URL**: `next.config.mjs`
  - `/legalization-check.html` → `/check` 영구 리다이렉트
  - `/legalization-check` → `/check` 영구 리다이렉트
  - `/check`는 `app/check/page.tsx`에서 직접 제공
- **카드뉴스 페이지**: `app/card-news/page.tsx`, `components/card-news/CardNewsCarousel.tsx`
  - 카드뉴스 이미지: `public/card1.png` ~ `public/card8.png`
  - 정적 HTML 백업/공유용 페이지: `public/legalization-card-news.html`
- **검색엔진/소유확인 파일**:
  - `public/sitemap.xml`: 대표 URL(`https://www.archlegal.co.kr`) 기준 sitemap
  - `public/robots.txt`: sitemap 위치 및 차단 경로 정의
  - `public/naver487c0dcb77e92d04a2a494edf158344a.html`: 네이버 서치어드바이저 소유확인 파일
- **전역 복사 보호**: `components/CopyProtection.tsx`
  - 운영 페이지에서 우클릭, copy/cut/paste, selectstart, dragstart, 주요 단축키 차단

---

## 📁 최상위 디렉토리 구조

```
rex/
├── app/                    # Next.js App Router 디렉토리 (페이지 및 API 라우팅)
├── components/             # 재사용 가능한 React 컴포넌트
├── lib/                    # 유틸리티, 서비스, 상수 등 핵심 라이브러리
├── hooks/                  # 커스텀 React Hooks
├── types/                  # TypeScript 타입 정의
├── public/                 # 정적 파일 (이미지, 폰트 등)
├── scripts/                # 데이터 마이그레이션 및 관리 스크립트
├── supabase/               # Supabase 설정 및 마이그레이션
├── e2e/                    # E2E 테스트 (Playwright)
├── docs/                   # 프로젝트 문서
└── [설정 파일들]
```

---

## 📂 주요 디렉토리 상세 설명

### 1. `/app` - Next.js App Router
Next.js 13+의 App Router를 사용한 페이지 및 API 라우팅

#### 구조:
```
app/
├── (auth)/                    # [Route Group] 인증 관련 페이지 그룹
├── (marketing)/               # [Route Group] 마케팅/랜딩 페이지 그룹
├── api/                       # API Routes
│   ├── admin/                 # 관리자 전용 API
│   ├── auth/                  # 인증 관련 API
│   ├── building/              # 건물 정보 조회 API
│   ├── consultations/         # 상담 관리 API
│   ├── debug/                 # 디버그용 API
│   ├── diagnosis/             # 1분 자가진단 계산 API
│   ├── enforcement-fine/      # 이행강제금 계산기 API
│   ├── juso/                  # 주소 검색 API (국가 주소 API 연동)
│   ├── payments/              # 결제 처리 API (TossPay)
│   ├── upload/                # 파일 업로드 API (Google Drive)
│   └── users/                 # 사용자 관리 API
├── auth/                      # 인증 페이지 (로그인, 회원가입 등)
├── calc/                      # 이행강제금 계산기 페이지
├── check/                     # 1분 양성화 자가진단 페이지
├── mypage/                    # 마이페이지
├── request/                   # 상담 요청 페이지
├── signup/                    # 회원가입 페이지
├── card-news/                 # 양성화 카드뉴스 페이지
├── enforcement-fine/          # /calc 리다이렉트 라우트
├── supercore/                 # 관리자/슈퍼유저 페이지
├── upload/                    # 파일 업로드 페이지
├── layout.tsx                 # 루트 레이아웃 (전역 레이아웃)
├── globals.css                # 전역 스타일
├── page.tsx                   # 홈페이지 (/)
└── not-found.tsx              # 404 페이지

```

#### 주요 파일/디렉토리 기능:
- **Route Groups `(auth)`, `(marketing)`**: URL 경로에 영향을 주지 않고 라우트를 논리적으로 그룹화
- **`api/`**: 서버사이드 API 엔드포인트
  - `admin/`: 관리자 권한 검증, 통계, 사용자 관리 등
  - `consultations/`: 상담 CRUD, 상태 업데이트
  - `diagnosis/`: 자가진단 답변 기반 결과 계산
  - `enforcement-fine/`: 계산 준비, 최종 계산, 위반유형/구조/용도 옵션 조회
  - `upload/`: Google Drive 연동 파일 업로드
  - `payments/`: TossPay 결제 처리 및 검증
- **`layout.tsx`**: 모든 페이지에 공통으로 적용되는 레이아웃 (헤더, 푸터, Provider 등)
- **`check/page.tsx`**: 1분 양성화 자가진단 페이지
- **`calc/page.tsx`**: 이행강제금 계산기 페이지
- **`card-news/page.tsx`**: 양성화 카드뉴스 페이지. `CardNewsCarousel`과 `SiteFooter`를 조합해 구성
- **`globals.css`**: Tailwind CSS 임포트 및 전역 스타일

---

### 2. `/components` - React 컴포넌트
재사용 가능한 UI 컴포넌트 모음

#### 구조:
```
components/
├── auth/                      # 인증 관련 컴포넌트
│   ├── AuthPanel.tsx          # 로그인/회원가입 진입 패널
│   ├── SignupForm.tsx         # 회원가입 폼
│   └── hooks/                 # 인증 UI 전용 훅
├── card-news/                 # 양성화 카드뉴스 컴포넌트
│   └── CardNewsCarousel.tsx   # 카드뉴스 슬라이드/CTA
├── consultation/              # 상담 관련 컴포넌트
│   ├── ConsultationForm.tsx   # 상담 신청 폼
│   ├── FileUpload.tsx         # 파일 업로드 UI
│   └── sections/              # 상담 폼 섹션 컴포넌트
├── diagnosis/                 # 1분 양성화 자가진단 컴포넌트
│   └── LegalizationCheckClient.tsx # 질문/결과/공유/상담 전환 UI
├── enforcement-fine/          # 이행강제금 계산기 컴포넌트
│   └── EnforcementFineCalculatorClient.tsx # 주소 조회, 계산 입력, 결과/상담 전환 UI
├── landing/                   # 랜딩 페이지 컴포넌트
│   ├── LandingPage.tsx        # 메인 랜딩 페이지
│   ├── FAQAccordion.tsx       # FAQ 아코디언
│   ├── ConsultationModal.tsx  # 상담 CTA 모달
│   ├── LoginModal.tsx         # 카카오 로그인 모달
│   └── Timeline.tsx           # 절차 타임라인
├── layout/                    # 레이아웃 컴포넌트
│   └── SiteFooter.tsx         # 공통 푸터
├── mypage/                    # 마이페이지 컴포넌트
│   ├── MyPageShell.tsx        # 마이페이지 레이아웃
│   ├── MyPageInfoSection.tsx  # 회원 정보
│   ├── MyPageConsultationsSection.tsx # 상담 내역
│   └── MyPagePaymentsSection.tsx      # 결제 내역/단계
├── providers/                 # Context Providers
│   ├── QueryProvider.tsx      # React Query Provider
│   └── SupabaseProvider.tsx   # Supabase Client Provider
├── supercore/                 # 관리자 전용 컴포넌트
│   └── AdminDashboard.tsx     # 관리자 대시보드
├── ui/                        # 기본 UI 컴포넌트 (shadcn/ui)
│   ├── button.tsx             # 버튼
│   ├── dialog.tsx             # 다이얼로그/모달
│   ├── input.tsx              # 인풋
│   ├── card.tsx               # 카드
│   └── ...                    # 기타 UI 컴포넌트
└── CopyProtection.tsx         # 복사 방지 컴포넌트
```

#### 명명 규칙:
- **파일명**: PascalCase (예: `LoginForm.tsx`)
- **컴포넌트 타입별 분류**:
  - `*Form.tsx`: 폼 컴포넌트
  - `*Card.tsx`: 카드 형태 컴포넌트
  - `*List.tsx`: 리스트 컴포넌트
  - `*Provider.tsx`: Context Provider

---

### 3. `/lib` - 핵심 라이브러리
비즈니스 로직, 유틸리티, 서비스, 상수 등

#### 구조:
```
lib/
├── auth/                      # 인증 관련 유틸리티
│   ├── supabase.ts            # Supabase 클라이언트 초기화
│   ├── session.ts             # 세션 관리
│   └── permissions.ts         # 권한 검증 로직
├── constants/                 # 상수 정의
│   ├── routes.ts              # 라우트 경로 상수
│   ├── status.ts              # 상담 상태 상수
│   └── config.ts              # 설정 상수
├── diagnosis/                 # 1분 자가진단 질문/분기/결과 로직
│   ├── legalization.ts
│   └── __tests__/legalization.test.ts
├── enforcement-fine/          # 이행강제금 계산기 준비/계산 로직
│   ├── prepare.ts             # 주소/건축물대장/VWorld 조회 및 기준자료 매핑
│   └── calculate.ts           # 이행강제금 산식, 감경/가중, 결과 저장
├── services/                  # 외부 서비스 통합
│   ├── consultation-drive-service.ts  # Google Drive 연동 서비스
│   └── upload-context.ts      # 업로드 컨텍스트 관리
├── utils/                     # 유틸리티 함수
│   ├── admin-auth.ts          # 관리자 인증 유틸
│   ├── building-info.ts       # 건물 정보 조회 유틸
│   ├── file-upload.ts         # 파일 업로드 유틸
│   ├── logger.ts              # 로깅 유틸
│   ├── navigation.ts          # 네비게이션 유틸
│   └── supabase-admin.ts      # Supabase Admin 클라이언트
├── validations/               # Zod 스키마 정의 (데이터 검증)
│   ├── auth.ts                # 인증 데이터 검증
│   ├── consultation.ts        # 상담 데이터 검증
│   └── user.ts                # 사용자 데이터 검증
├── google/                    # Google API 관련
│   └── drive.ts               # Google Drive API 설정
├── telegram.ts                # Telegram Bot API 통합
└── utils.ts                   # 기타 유틸리티 (cn 등)
```

#### 주요 파일 설명:
- **`services/consultation-drive-service.ts`**:
  - Google Drive에 상담 관련 파일 업로드/다운로드
  - 폴더 구조 관리
  - 파일 메타데이터 관리

- **`utils/file-upload.ts`**:
  - 파일 업로드 전 검증 (파일 크기, 타입 등)
  - 파일명 정규화
  - 업로드 에러 핸들링

- **`validations/`**:
  - Zod 스키마를 사용한 런타임 타입 검증
  - API 요청/응답 데이터 검증
  - 폼 데이터 검증

- **`telegram.ts`**:
  - 알림 전송 (상담 신청, 결제 완료 등)
  - 관리자 알림

- **`diagnosis/legalization.ts`**:
  - 1분 자가진단 질문/답변/결과 등급 정의
  - 특별조치법 요건, 이행강제금/과태료 확인 플래그, 상담 전환 문구 생성

- **`enforcement-fine/prepare.ts`**:
  - 주소 선택값과 건축물대장 정보를 기준으로 계산 준비 데이터 생성
  - VWorld 개별공시지가, 구조지수, 용도지수, 위치지수, 잔가율 후보 매핑
  - 조회 실패 사유를 warning으로 반환해 운영 진단 가능하게 유지

- **`enforcement-fine/calculate.ts`**:
  - 위반유형별 건축법 제80조 산식 적용
  - 시가표준액, 증축/대수선 비율, 감경/가중 조건, 계산 버전과 산출근거 구성
  - 계산 결과를 Supabase `enforcement_fine_estimates`에 저장

---

### 4. `/hooks` - 커스텀 React Hooks
재사용 가능한 React Hooks

#### 구조:
```
hooks/
└── useConsultationList.ts     # 상담 목록 조회 훅
```

#### 주요 Hook:
- **`useConsultationList.ts`**:
  - React Query를 사용한 상담 목록 조회
  - 페이지네이션, 필터링, 정렬
  - 자동 리페치 및 캐싱

---

### 5. `/types` - TypeScript 타입 정의
전역 타입 및 인터페이스 정의

#### 구조:
```
types/
├── mypage.ts                  # 마이페이지 관련 타입
└── profile.ts                 # 프로필 관련 타입
```

#### 타입 정의 위치:
- `/types`: 여러 모듈에서 공유되는 전역 타입
- 각 컴포넌트/모듈 내부: 해당 모듈에서만 사용되는 로컬 타입

---

### 6. `/public` - 정적 파일
빌드 시 그대로 배포되는 정적 파일

#### 구조:
```
public/
├── card1.png ~ card8.png      # 양성화 카드뉴스 이미지
├── docu/                      # favicon, OG 이미지, PDF 자료
│   ├── archlegal-fa.ico
│   ├── archlegal-fa-p.png
│   ├── archlegal-fa-p-transparent.png
│   ├── archlegal-og.png
│   ├── company-interview.pdf
│   └── 양성화 절차 안내.pdf
├── hero.png                   # 랜딩 히어로 이미지
├── legalization-card-news.html # 카드뉴스 정적 HTML 페이지
├── naver487c0dcb77e92d04a2a494edf158344a.html # 네이버 소유확인 파일
├── robots.txt                 # 검색엔진 크롤링 정책
└── sitemap.xml                # 대표 URL 기준 sitemap
```

#### 사용법:
```tsx
// 예시: /public/images/logo.png 사용
<Image src="/images/logo.png" alt="Logo" />
```

#### SEO/정적 페이지 운영 메모:
- 자가진단 대표 공개 URL은 Next 페이지 `/check`를 사용하고, 기존 정적 HTML 주소는 `/check`로 리다이렉트한다.
- `public/sitemap.xml`은 `https://www.archlegal.co.kr` 대표 URL 기준으로 관리한다.
- `양성화.com`은 유입/리다이렉트 도메인으로 사용하고, 대표 canonical/sitemap은 `www.archlegal.co.kr` 기준이다.
- 네이버 서치어드바이저 소유확인 파일은 삭제하지 않는다.

---

### 7. `/scripts` - 관리 스크립트
데이터 마이그레이션, 테스트 데이터 생성 등

#### 구조:
```
scripts/
├── create_test_user.ts        # 테스트 사용자 생성
├── generate-admin-hash.js     # 관리자 비밀번호 해시 생성
├── import-seoul-buildings.js  # 서울시 건물 데이터 임포트 (JS)
├── import_seoul_building_data.py   # 서울시 건물 데이터 임포트 (Python)
├── import_seoul_building_title.py  # 서울시 건물 등기부 데이터 임포트
├── import_seoul_csv.py        # 서울시 CSV 데이터 임포트
├── delete-drive-file.js       # Google Drive 파일 삭제 (관리용)
└── test-upload-logs.js        # 업로드 로그 테스트
```

#### 실행 방법:
```bash
# TypeScript 스크립트
npx ts-node scripts/create_test_user.ts

# JavaScript 스크립트
node scripts/generate-admin-hash.js

# Python 스크립트
python3 scripts/import_seoul_csv.py
```

---

### 8. `/supabase` - Supabase 설정
데이터베이스 마이그레이션 및 설정

#### 구조:
```
supabase/
├── migrations/                # 데이터베이스 마이그레이션 파일
│   ├── 20240101_create_users.sql
│   ├── 20240102_create_consultations.sql
│   ├── 033_create_enforcement_fine_tables.sql
│   ├── 034_seed_enforcement_fine_reference_data.sql
│   ├── 035_* ~ 042_* enforcement fine reference updates
│   ├── 043_correct_special_condition_increase_rates.sql
│   └── 044_seed_additional_reduction_special_conditions.sql
├── .temp/                     # 임시 파일 (gitignore)
└── admin.ts                   # Supabase Admin 설정
```

#### 이행강제금 계산기 DB 메모:
- `033_create_enforcement_fine_tables.sql`: 기준시가, 구조/용도/위치지수, 잔가율, 보정률, 계산 결과 저장 테이블 생성
- `034_seed_enforcement_fine_reference_data.sql`: 2026 기준 기초 데이터 시드
- `035`~`044`: 보정률, 위반유형, 증축/대수선 비율, 감경/가중 조건, 구조/용도 인덱스 보강 및 오류 보정
- 기준자료 테이블은 인증 사용자 조회 정책을 사용하고, `enforcement_fine_estimates`는 사용자 본인 결과만 조회/수정 가능하게 RLS 적용

#### 마이그레이션 실행:
```bash
# 로컬 DB에 마이그레이션 적용
npx supabase db push

# 마이그레이션 생성
npx supabase migration new migration_name
```

---

### 9. `/e2e` - E2E 테스트
Playwright를 사용한 End-to-End 테스트

#### 구조:
```
e2e/
├── auth.spec.ts               # 인증 플로우 테스트
├── consultation.spec.ts       # 상담 기능 테스트
└── payment.spec.ts            # 결제 플로우 테스트
```

#### 실행:
```bash
npm run test:e2e
```

---

### 10. `/docs` - 프로젝트 문서
API 문서, 기능 명세, 설정 가이드 등

#### 주요 문서:
- `docs/모듈별 상세 개발정의서.md`: 모듈별 구현 요약과 주요 파일/API/DB 위치
- `docs/folder-structure.md`: 전체 폴더 구조와 기능별 파일 위치
- `docs/legalization-1min-diagnosis-spec.md`: 1분 양성화 자가진단 질문/답변/결과 기준
- `docs/legalization-special-act-current.md`: 특정건축물 정리 특별조치법 기준 문서
- `docs/enforcement-fine/README.md`: 이행강제금 계산기 문서 묶음 안내
- `docs/enforcement-fine/spec.md`: 이행강제금 계산기 상세 개발 정의서
- `docs/enforcement-fine/verification-cases.md`: 실제 사례 검증표
- `docs/enforcement-fine/*.md`: 구조지수, 용도지수, 위치지수, 잔가율, 2026 시가표준액 기준자료

---

## 📄 주요 설정 파일

### 루트 디렉토리 설정 파일들:

| 파일명 | 설명 |
|--------|------|
| `package.json` | npm 패키지 설정 및 의존성 관리 |
| `tsconfig.json` | TypeScript 컴파일러 설정 |
| `next.config.mjs` | Next.js 설정 |
| `tailwind.config.ts` | Tailwind CSS 설정 |
| `postcss.config.js` | PostCSS 설정 (Tailwind 처리) |
| `.env.local` | 환경 변수 (로컬 개발용, gitignore) |
| `.env.example` | 환경 변수 예시 템플릿 |
| `jest.config.js` | Jest 테스트 설정 |
| `playwright.config.ts` | Playwright E2E 테스트 설정 |
| `.eslintrc.json` | ESLint 코드 린팅 규칙 |
| `components.json` | shadcn/ui 컴포넌트 설정 |
| `CLAUDE.md` | Claude Code 설정 및 Hooks |
| `ATTACHMENT_SETUP.md` | 첨부파일 기능 설정 가이드 |

---

## 🎯 핵심 기능별 파일 위치

### 1. 인증 (Authentication)
- **UI 컴포넌트**: `components/auth/`
- **API**: `app/api/auth/`
- **페이지**: `app/auth/`, `app/signup/`
- **유틸리티**: `lib/auth/`
- **타입**: `types/profile.ts`

### 2. 상담 관리 (Consultation Management)
- **UI 컴포넌트**: `components/consultation/`
- **API**: `app/api/consultations/`
- **페이지**: `app/request/`, `app/mypage/`
- **Hook**: `hooks/useConsultationList.ts`
- **서비스**: `lib/services/consultation-drive-service.ts`

### 3. 파일 업로드 (File Upload)
- **API**: `app/api/upload/`
- **페이지**: `app/upload/`
- **서비스**:
  - `lib/services/consultation-drive-service.ts` (Google Drive)
  - `lib/services/upload-context.ts` (업로드 상태 관리)
- **유틸리티**: `lib/utils/file-upload.ts`

### 4. 결제 (Payment)
- **API**: `app/api/payments/`
- **주요 API 엔드포인트**
  - `app/api/payments/confirm/route.ts` : Toss 결제 승인
  - `app/api/payments/stages/route.ts` : 사용자 결제 단계 조회
  - `app/api/payments/webhook/route.ts` : Toss 웹훅(취소/부분취소) 수신
- **컴포넌트**
  - `components/landing/Pricing.tsx`
  - `components/mypage/MyPagePaymentsSection.tsx` : 마이페이지 결제 위젯/단계 관리
  - `components/mypage/MyPagePaymentSuccess.tsx` : 결제 성공 후 승인 확인 UI
- **통합**: TossPay SDK (package.json)

### 5. 관리자 기능 (Admin)
- **페이지**: `app/supercore/`
- **API**: `app/api/admin/`
- **컴포넌트**: `components/supercore/`
- **유틸리티**: `lib/utils/admin-auth.ts`

### 6. 건물 정보 조회
- **API**: `app/api/building/`, `app/api/juso/`
- **유틸리티**: `lib/utils/building-info.ts`
- **데이터**: `scripts/import-seoul-*.{js,py}`

### 7. 마케팅/SEO/양성화.com
- **전역 메타/브랜딩**: `app/layout.tsx`
  - `applicationName`
  - `title`, `description`
  - `openGraph`, `twitter`
  - Google/Naver/Bing 소유확인 메타
- **랜딩 페이지 메타/본문**: `app/(marketing)/landing/page.tsx`, `components/landing/LandingPage.tsx`
- **공통 푸터 브랜딩**: `components/layout/SiteFooter.tsx`
- **1분 양성화 자가진단**: `app/check/page.tsx`, `components/diagnosis/LegalizationCheckClient.tsx`, `lib/diagnosis/legalization.ts`
- **자가진단 공개 URL**: `next.config.mjs`의 기존 자가진단 URL redirect
- **이행강제금 계산기**: `app/calc/page.tsx`, `components/enforcement-fine/EnforcementFineCalculatorClient.tsx`, `lib/enforcement-fine/prepare.ts`, `lib/enforcement-fine/calculate.ts`
- **이행강제금 계산기 API**: `app/api/enforcement-fine/prepare/route.ts`, `app/api/enforcement-fine/calculate/route.ts`, `app/api/enforcement-fine/violation-types/route.ts`, `app/api/enforcement-fine/structure-options/route.ts`, `app/api/enforcement-fine/use-options/route.ts`
- **이행강제금 기준자료 DB**: `supabase/migrations/033_create_enforcement_fine_tables.sql` ~ `supabase/migrations/044_seed_additional_reduction_special_conditions.sql`
- **계산기 문서**: `docs/enforcement-fine/README.md`, `docs/enforcement-fine/spec.md`, `docs/enforcement-fine/verification-cases.md`
- **카드뉴스 페이지**: `app/card-news/page.tsx`, `components/card-news/CardNewsCarousel.tsx`
- **검색엔진 파일**: `public/sitemap.xml`, `public/robots.txt`, `public/naver487c0dcb77e92d04a2a494edf158344a.html`

---

## 🔧 코드 수정 시 체크리스트

### 새로운 페이지 추가 시:
1. `app/` 디렉토리에 폴더 생성 (예: `app/new-page/`)
2. `page.tsx` 생성
3. 필요 시 `layout.tsx` 생성 (해당 페이지만의 레이아웃)
4. 라우트 상수를 `lib/constants/routes.ts`에 추가

### 새로운 API 엔드포인트 추가 시:
1. `app/api/` 하위에 폴더 생성 (예: `app/api/new-endpoint/`)
2. `route.ts` 생성 (GET, POST 등 HTTP 메서드 정의)
3. Zod 스키마로 요청/응답 검증 (`lib/validations/`)
4. 필요 시 타입 정의 (`types/`)

### 새로운 컴포넌트 추가 시:
1. 적절한 카테고리 디렉토리에 생성 (예: `components/consultation/NewComponent.tsx`)
2. 공통 UI는 `components/ui/`에 추가
3. 해당 컴포넌트만의 타입은 파일 내부에, 공유 타입은 `types/`에 정의

### 환경 변수 추가 시:
1. `.env.local`에 실제 값 추가 (gitignore됨)
2. `.env.example`에 예시 값 추가 (버전 관리)
3. 타입 안전성을 위해 `process.env.VARIABLE_NAME` 사용 전 검증

### 데이터베이스 변경 시:
1. `supabase/migrations/` 폴더에 새 마이그레이션 생성
2. `npx supabase db push`로 적용
3. 타입 정의 업데이트 (`types/`)

---

## 📋 명명 규칙 (Naming Conventions)

### 파일명:
- **컴포넌트**: PascalCase (예: `LoginForm.tsx`)
- **유틸리티/서비스**: kebab-case (예: `file-upload.ts`)
- **Hook**: camelCase, "use" 접두사 (예: `useConsultationList.ts`)
- **타입**: kebab-case (예: `mypage.ts`)
- **API Route**: kebab-case 폴더, `route.ts` 파일명 고정

### 변수/함수명:
- **변수**: camelCase (예: `userName`)
- **상수**: UPPER_SNAKE_CASE (예: `MAX_FILE_SIZE`)
- **함수**: camelCase (예: `getUserProfile`)
- **컴포넌트**: PascalCase (예: `LoginForm`)
- **타입/인터페이스**: PascalCase (예: `UserProfile`)

### 폴더명:
- **kebab-case** (예: `consultation-drive-service/`)
- Route Group은 괄호 사용 (예: `(auth)/`, `(marketing)/`)

---

## 🚀 개발 워크플로우

### 로컬 개발 서버 실행:
```bash
npm run dev
# http://localhost:3002 에서 실행
```

### 빌드:
```bash
npm run build
```

### 테스트:
```bash
# 전체 테스트
npm run test

# 단위 테스트만
npm run test:unit

# E2E 테스트만
npm run test:e2e
```

---

## 📚 추가 참고 문서
- [ATTACHMENT_SETUP.md](./ATTACHMENT_SETUP.md): 첨부파일 기능 설정 가이드
- [agent.md](./agent.md): AI 에이전트 설정
- [todo.md](./todo.md): 개발 TODO 리스트

---

## 💡 Claude/Codex 사용 시 팁

### 파일 수정 요청 시:
```
"components/consultation/ConsultationForm.tsx 파일을 수정해서
전화번호 필드를 추가해줘"
```

### 새 기능 추가 요청 시:
```
"상담 상태를 변경하는 API를 app/api/consultations/[id]/status/route.ts에 만들어줘.
lib/validations/consultation.ts에 검증 스키마도 추가하고"
```

### 구조 확인 시:
```
"상담 관련 파일들이 어디에 있어?"
→ components/consultation/, app/api/consultations/, hooks/useConsultationList.ts 확인
```

---

**마지막 업데이트**: 2026-05-28
**프로젝트 버전**: 0.1.1
