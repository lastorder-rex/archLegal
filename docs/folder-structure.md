# Folder Structure

This document outlines the key directories and configuration files in the `archLegal` repository.

```text
archLegal/
├── app/
│   ├── (auth)/                 # 로그인/회원가입 관련 경로 그룹
│   │   └── login/              # 로그인 페이지
│   ├── (marketing)/            # 마케팅 페이지 섹션
│   │   ├── landing/            # 랜딩 페이지
│   │   ├── press/              # 언론 보도 페이지
│   │   ├── privacy-policy/     # 개인정보처리방침
│   │   ├── refund-policy/      # 환불 정책
│   │   └── terms-of-service/   # 이용약관
│   ├── api/                    # Next.js Route Handlers (REST API)
│   │   ├── admin/              # 관리자 API (인증, 상담, 회원, 결제)
│   │   ├── auth/               # 사용자 인증 API
│   │   ├── building/           # 건축물 정보 API
│   │   ├── consultations/      # 상담 신청 API
│   │   ├── debug/              # 디버그 유틸리티
│   │   ├── juso/               # 주소 검색 API
│   │   ├── payments/           # 결제 API (토스페이먼츠 연동)
│   │   └── users/              # 사용자 프로필 API
│   ├── auth/                   # Supabase Auth 콜백
│   │   ├── callback/           # OAuth 리다이렉트 핸들러
│   │   └── error/              # 인증 에러 페이지
│   ├── mypage/                 # 마이페이지 섹션
│   │   ├── consultations/      # 내 상담 내역
│   │   ├── info/               # 회원정보 수정
│   │   └── payments/           # 결제 내역 및 결제 진행
│   ├── request/                # 상담 신청
│   │   └── history/            # 상담 신청 이력
│   ├── signup/                 # 회원가입 페이지
│   ├── supercore/              # 관리자 콘솔
│   │   ├── admins/             # 관리자 계정 관리
│   │   ├── consultations/      # 상담 관리 (결제 요청 포함)
│   │   └── users/              # 회원 관리
│   ├── globals.css             # 전역 스타일 (Tailwind, Flatpickr 테마)
│   ├── layout.tsx              # 루트 레이아웃 (메타데이터, SEO)
│   └── page.tsx                # 홈페이지
├── components/
│   ├── auth/                   # 로그인/회원가입 폼
│   ├── consultation/           # 상담 폼, 주소 검색, 건축물 정보
│   ├── landing/                # 마케팅 랜딩 전용 컴포넌트
│   ├── layout/                 # 헤더/푸터, 사이트 공통 레이아웃
│   ├── mypage/                 # 마이페이지 전용 컴포넌트
│   ├── supercore/              # 관리자 콘솔 전용 UI
│   ├── ui/                     # shadcn 기반 공통 UI 프리미티브 (DateInput 포함)
│   └── providers/              # 전역 컨텍스트/테마 공급자
├── hooks/                      # React Query 등 비즈니스 훅 모음
├── docs/
│   ├── folder-structure.md     # 이 파일
│   ├── report.md               # 진행 리포트/회고
│   └── BUILDING_DATA_IMPORT.md # 건축물 데이터 정리 및 적재 방법
├── lib/
│   ├── auth/                   # 인증/세션 유틸리티 (user-session.ts)
│   ├── constants/              # 상수(연락처, 랜딩 데이터 등)
│   ├── utils/                  # 공통 유틸 (admin-auth.ts, supabase-admin.ts 등)
│   └── validations/            # Zod 스키마 (payment.ts, user.ts 등)
├── public/
│   ├── docu/                   # 서비스 문서 및 정적 자료 (PDF, 이미지)
│   ├── robots.txt              # 검색엔진 크롤러 지시 파일
│   └── sitemap.xml             # 검색엔진용 사이트맵
├── scripts/
│   ├── import_seoul_building_title.py  # Supabase 표제부 데이터 업서트 스크립트
│   └── ...                             # 기타 데이터 마이그레이션 도구
├── supabase/
│   ├── migrations/              # SQL 마이그레이션 (결제 단계 테이블 등)
│   └── .temp/                   # Supabase CLI 캐시
├── types/                       # 공용 TypeScript 타입 선언
├── components.json              # shadcn-ui 설정
├── next-env.d.ts                # Next.js 타입 정의 (자동 생성)
├── next.config.mjs              # Next.js 런타임 설정
├── package.json                 # 의존성 (flatpickr, @tosspayments/tosspayments-sdk 등)
├── postcss.config.js            # PostCSS 플러그인 설정
├── tailwind.config.ts           # Tailwind 테마/토큰
└── tsconfig.json                # TypeScript 컴파일러 설정
```

## Directory Notes

- **app/** – Next.js App Router entrypoint. Route groups `(auth)`, `(marketing)`, 마이페이지, 관리자 콘솔, API routes 포함.
- **components/** – 도메인별/공통 UI 컴포넌트 집합. auth, consultation, landing, mypage, supercore, ui(shadcn) 등으로 분리.
- **docs/** – 프로젝트 문서와 리포트, 데이터 적재 가이드 등 참고 자료.
- **lib/** – 인증/세션/검증 등 비 UI 로직과 상수 정의. `admin-auth.ts`, `payment.ts` 등 유틸리티 포함.
- **hooks/** – React Query 기반 데이터 훅, 폼 상태 훅 등 재사용 가능한 로직.
- **public/** – 정적 자산(이미지, PDF, 문서), SEO 파일(robots.txt, sitemap.xml).
- **scripts/** – 데이터 마이그레이션·Supabase 업로드 등 보조 Python 스크립트.
- **supabase/** – Supabase 프로젝트 설정, SQL 마이그레이션(결제 단계 테이블 등), RLS 정책.
- **types/** – 다양한 모듈에서 공유하는 TypeScript 타입 선언을 중앙 관리.

## Configuration Files

- **components.json** – shadcn UI 설정 파일.
- **next.config.mjs** – Next.js runtime configuration.
- **postcss.config.js** – PostCSS plugins (Tailwind CSS, autoprefixer, etc.).
- **tailwind.config.ts** – Tailwind CSS theme definitions aligned with TweakCN tokens.
- **tsconfig.json** – TypeScript compiler options for the workspace.
- **next-env.d.ts** – Next.js ambient type declarations (auto-generated).
- **package.json** – Project dependencies and npm scripts.

위 구조를 기준으로 새 기능이나 문서를 추가하면 폴더 목적에 따라 빠르게 위치를 잡을 수 있습니다. 용도에 맞지 않는 파일이 발견되면 PR에서 즉시 논의해주세요.
