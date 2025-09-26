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
