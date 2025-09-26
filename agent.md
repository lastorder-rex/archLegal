# Repository Guidelines

## Project Structure & Module Organization
Source lives in `app/` (Next.js 14 app router) with domain-specific route groups derived from `docs/project_spec.md`. Shared UI sits in `components/` and follows the shadcn/TweakCN theme tokens. Non-UI logic and Supabase accessors belong to `lib/` and `supabase/` respectively; keep SQL policies alongside RLS notes from `docs/모듈별 상세 개발정의서.md`. Static assets stay under `public/`. Write Vitest suites in `tests/unit`, Playwright scenarios in `tests/e2e`, and keep architectural notes inside `docs/` with versioned headers. For a quick visual of the workspace layout, review `docs/folder-structure.md` before reorganizing files.

## Build, Test, and Development Commands
Install dependencies with `npm install` (or `pnpm install` if already set up). `npm run dev` launches the local Next.js server with Tailwind hot reload. `npm run lint` runs ESLint/Prettier. `npm run build` generates the production bundle that Vercel deploys. `npm run test:unit` executes Vitest, while `npm run test:e2e` (Playwright) targets the staged build; both must pass before opening a PR. Use `npm run test` to run the full suite. Trigger a Vercel preview by pushing to any feature branch.

## Coding Style & Naming Conventions
Use TypeScript with strict mode on. Components and hooks use `PascalCase` and `camelCase` respectively; Tailwind utility first, followed by custom classes created via the TweakCN preset. Keep files small and colocate tests (`Button.test.tsx`) near related modules when practical. Run `npm run lint -- --fix` before pushing.

## Testing Guidelines
New core modules require Vitest specs covering edge cases plus Playwright smoke flows. Name unit specs `<module>.spec.ts`. Prefer Supabase test doubles over live calls; when live tests are unavoidable, isolate credentials with dedicated test service roles. Maintain coverage thresholds defined in `vitest.config.ts`; flag regressions in the PR description.

## Commit & Pull Request Guidelines
Work on feature branches (`feature/<issue-key>-short-topic`). Commits follow Conventional Commits (`feat: add bookings webhook`). Reference Supabase or TossPayments migrations in the body when relevant. PRs must link the spec section touched, include screenshots for UI changes, attach Playwright trace artifacts, and confirm `CHANGELOG.md` plus documentation version headers are updated.

## Security & Operational Notes
Manage secrets through Vercel (runtime) and Supabase (database) dashboards; never commit `.env*`. Enforce RLS policies for all data access. Webhooks must stay idempotent (store TossPayments event IDs) and log signature results. Kakao 알림톡 requires approved templates—document template IDs and rate limits in `docs/` whenever they change.

## UI Guide
Theme: TweakCN 지정 테마 + shadcn/ui 구성요소를 사용합니다. Tailwind 유틸을 우선 적용하고 필요한 경우 TweakCN 토큰으로 확장하세요.

- **접근성**: 모든 인터랙티브 요소에 a11y 라벨 및 키보드 포커스를 제공하고, 대비비율은 WCAG AA 이상을 유지합니다.
- **Responsive**: 모바일 우선 레이아웃을 기준으로 360‒1440px 주요 스냅샷을 PR에 첨부하는 것을 권장합니다.
- **이미지**: 기본 포맷은 WebP를 사용하며 hero 이미지는 1920×1080으로 최적화합니다.

### 지원 브라우저 & 성능 목표
- **브라우저**: Chrome / Edge / Safari 최신-1, iOS / Android 최신-1을 정식 지원합니다.
- **성능 지표**:
  - LCP (Largest Contentful Paint) ≤ 2.5초 — 메인 콘텐츠가 사용자에게 보이는 시간
  - CLS (Cumulative Layout Shift) ≤ 0.1 — 페이지 로딩 중 레이아웃 흔들림 최소화

> 용어 설명: LCP는 페이지에서 가장 큰 이미지 또는 텍스트 블록이 렌더링되는 시점을 의미하고, CLS는 로딩 중 예상치 못한 요소 이동 정도를 나타냅니다 (0에 가까울수록 우수).

## UI 테마 적용 가이드

### 프로젝트 테마 적용
- 본 프로젝트는 tweakcn에서 제공하는 사전 정의 테마를 사용합니다.
- 테마 링크: [https://tweakcn.com/themes/cmfq4sm9z000204k09v180y3b](https://tweakcn.com/themes/cmfq4sm9z000204k09v180y3b)

### 설치 방법
```bash
pnpm dlx shadcn@latest add https://tweakcn.com/themes/cmfq4sm9z000204k09v180y3b
```

### Codex 개발 시 필수 적용 사항
- 모든 컴포넌트는 테마의 색상 변수(CSS `--primary`, `--secondary` 등)를 사용합니다.
- shadcn/ui 컴포넌트를 추가하면 테마 색상이 자동으로 주입됩니다.
- 커스텀 스타일이 필요한 경우에도 Tailwind 클래스에서 테마 변수를 활용하세요.

### 적용 후 확인 사항
- `tailwind.config.ts`에서 테마 색상 설정이 올바르게 반영되었는지 확인합니다.
- `app/globals.css` 등에서 CSS 변수가 제대로 적용되는지 검증합니다.
- 다크/라이트 모드를 모두 점검하여 색상 대비 문제가 없는지 확인합니다.

### Codex 참고사항
- 테마는 shadcn/ui 기반이므로 `Button`, `Card`, `Input` 등 컴포넌트를 바로 import해 사용할 수 있습니다.
- 커스텀 색상이 필요하면 `className="bg-primary text-primary-foreground"`처럼 미리 정의된 색상 토큰을 사용합니다.

## 에이전트 상호작용 규칙
- 프로그램이나 설정 등의 변경 사항이 있을 때 별도의 확인 없이 즉시 적용합니다.
