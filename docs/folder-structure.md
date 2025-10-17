# Folder Structure

This document outlines the key directories and configuration files in the `archLegal` repository.

```text
archLegal/
├── app/
│   ├── (auth)/                 # 로그인/회원가입 관련 경로 그룹
│   ├── (marketing)/            # 랜딩 페이지 섹션
│   ├── api/                    # Next.js Route Handlers (REST API)
│   ├── request/                # 상담 신청/이력 화면
│   ├── supercore/              # 관리자 콘솔(상담 관리, 회원 관리 등)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── consultation/           # 상담 폼, 주소 검색, 건축물 정보 등
│   ├── landing/                # 마케팅 랜딩 전용 컴포넌트
│   ├── layout/                 # 헤더/푸터, 사이트 공통 레이아웃
│   ├── supercore/              # 관리자 콘솔 전용 UI
│   ├── ui/                     # shadcn 기반 공통 UI 프리미티브
│   └── providers/              # 전역 컨텍스트/테마 공급자
├── hooks/                      # React Query 등 비즈니스 훅 모음
├── docs/
│   ├── folder-structure.md
│   ├── report.md               # 진행 리포트/회고
│   └── BUILDING_DATA_IMPORT.md # 건축물 데이터 정리 및 적재 방법
├── lib/
│   ├── auth/                   # 인증/세션 유틸리티
│   ├── constants/              # 상수(연락처, 랜딩 데이터 등)
│   ├── utils/                  # 공통 유틸(예: 파일 업로드, 건축물 fallback)
│   └── validations/            # Zod 스키마 및 폼 검증 로직
├── public/
│   ├── docu/                   # 서비스 문서 및 정적 자료
│   ├── robots.txt              # 검색엔진 크롤러 지시 파일
│   └── sitemap.xml             # 검색엔진용 사이트맵
├── scripts/
│   ├── import_seoul_building_title.py  # Supabase 표제부 데이터 업서트 스크립트
│   └── ...                             # 기타 데이터 마이그레이션 도구
├── supabase/
│   ├── migrations/              # SQL 마이그레이션
│   └── .temp/                   # Supabase CLI 캐시
├── types/                       # 공용 TypeScript 타입 선언
├── components.json              # shadcn-ui 설정
├── next-env.d.ts                # Next.js 타입 정의 (자동 생성)
├── next.config.mjs              # Next.js 런타임 설정
├── package.json                 # 의존성 및 npm 스크립트
├── postcss.config.js            # PostCSS 플러그인 설정
├── tailwind.config.ts           # Tailwind 테마/토큰
└── tsconfig.json                # TypeScript 컴파일러 설정
```

## Directory Notes

- **app/** – Next.js App Router entrypoint containing route groups and global styling.
- **components/** – 도메인별/공통 UI 컴포넌트 집합. 상담, 관리자, 랜딩 등의 세부 폴더로 분리되어 있습니다.
- **docs/** – 프로젝트 문서와 리포트, 데이터 적재 가이드 등 참고 자료.
- **lib/** – 인증/주소/검증 등 비 UI 로직과 상수 정의.
- **hooks/** – React Query 기반 데이터 훅, 폼 상태 훅 등 재사용 가능한 로직.
- **public/** – 정적 자산(이미지, 문서). 대규모 데이터 파일은 별도 업로드 후 `.gitignore` 처리.
- **scripts/** – 데이터 마이그레이션·Supabase 업로드 등 보조 스크립트.
- **supabase/** – Supabase 프로젝트 설정, SQL 마이그레이션, 정책 스크립트.
- **types/** – 다양한 모듈에서 공유하는 타입 선언을 중앙 관리.

## Configuration Files

- **components.json** – shadcn UI 설정 파일.
- **next.config.mjs** – Next.js runtime configuration.
- **postcss.config.js** – PostCSS plugins (Tailwind CSS, autoprefixer, etc.).
- **tailwind.config.ts** – Tailwind CSS theme definitions aligned with TweakCN tokens.
- **tsconfig.json** – TypeScript compiler options for the workspace.
- **next-env.d.ts** – Next.js ambient type declarations (auto-generated).
- **package.json** – Project dependencies and npm scripts.

위 구조를 기준으로 새 기능이나 문서를 추가하면 폴더 목적에 따라 빠르게 위치를 잡을 수 있습니다. 용도에 맞지 않는 파일이 발견되면 PR에서 즉시 논의해주세요.
