# Project Specification

## Authentication Module (Kakao)
- Implement Kakao social authentication via Supabase Auth (OAuth).
- Auto-provision new users on first sign-in; persist to `users` table with `auth_id`, `full_name`, `email`, `phone`.
- Display welcome message after login and expose logout control.
- Reuse Supabase session cookies and honor RLS policies using auth helper clients.

Refer to `docs/모듈별 상세 개발정의서.md` for API contract and field mappings.
