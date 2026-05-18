# Rex - 프로젝트 폴더 구조 상세 가이드

## 프로젝트 개요
Next.js 14 기반의 법률 상담 관리 시스템 (App Router 사용)
- TypeScript로 작성
- Supabase를 백엔드 및 인증 시스템으로 사용
- Google Drive API를 통한 파일 관리
- TossPay 결제 시스템 연동
- Telegram Bot API 통합

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
│   ├── juso/                  # 주소 검색 API (국가 주소 API 연동)
│   ├── payments/              # 결제 처리 API (TossPay)
│   ├── upload/                # 파일 업로드 API (Google Drive)
│   └── users/                 # 사용자 관리 API
├── auth/                      # 인증 페이지 (로그인, 회원가입 등)
├── mypage/                    # 마이페이지
├── request/                   # 상담 요청 페이지
├── signup/                    # 회원가입 페이지
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
  - `upload/`: Google Drive 연동 파일 업로드
  - `payments/`: TossPay 결제 처리 및 검증
- **`layout.tsx`**: 모든 페이지에 공통으로 적용되는 레이아웃 (헤더, 푸터, Provider 등)
- **`globals.css`**: Tailwind CSS 임포트 및 전역 스타일

---

### 2. `/components` - React 컴포넌트
재사용 가능한 UI 컴포넌트 모음

#### 구조:
```
components/
├── auth/                      # 인증 관련 컴포넌트
│   ├── LoginForm.tsx          # 로그인 폼
│   ├── SignupForm.tsx         # 회원가입 폼
│   └── AuthGuard.tsx          # 인증 가드 (보호된 페이지)
├── consultation/              # 상담 관련 컴포넌트
│   ├── ConsultationCard.tsx   # 상담 카드
│   ├── ConsultationList.tsx   # 상담 목록
│   ├── ConsultationForm.tsx   # 상담 신청 폼
│   └── StatusBadge.tsx        # 상담 상태 뱃지
├── landing/                   # 랜딩 페이지 컴포넌트
│   ├── Hero.tsx               # 히어로 섹션
│   ├── Features.tsx           # 기능 소개 섹션
│   ├── Pricing.tsx            # 가격표 섹션
│   └── FAQ.tsx                # FAQ 섹션
├── layout/                    # 레이아웃 컴포넌트
│   ├── Header.tsx             # 헤더
│   └── Footer.tsx             # 푸터
├── mypage/                    # 마이페이지 컴포넌트
│   ├── ProfileCard.tsx        # 프로필 카드
│   ├── ConsultationHistory.tsx # 상담 내역
│   └── SettingsForm.tsx       # 설정 폼
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
├── images/                    # 이미지 파일
├── fonts/                     # 웹 폰트
└── favicon.ico                # 파비콘
```

#### 사용법:
```tsx
// 예시: /public/images/logo.png 사용
<Image src="/images/logo.png" alt="Logo" />
```

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
│   └── ...
├── .temp/                     # 임시 파일 (gitignore)
└── admin.ts                   # Supabase Admin 설정
```

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

**마지막 업데이트**: 2025-11-03
**프로젝트 버전**: 0.1.1
