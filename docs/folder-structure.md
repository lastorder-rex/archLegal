# Folder Structure (Key Points)
```
app/                 Next.js App Router, pages & APIs
  api/              Route Handlers (admin/auth/payments/upload 등)
  supercore/        관리자 UI (결제 상세, 토큰 관리)
  upload/           고객 업로드 페이지 디렉터리
components/         도메인별/공통 UI 컴포넌트
lib/                인증 · Supabase · Drive 유틸리티
hooks/              React 상태/데이터 훅
docs/               사내 문서 (upload, drive, 구조 등)
public/             정적 자산 (PDF, 이미지)
scripts/            마이그레이션/보조 스크립트
supabase/           SQL 마이그레이션, CLI 캐시
```

- 핵심 변경: `app/api/admin/payments/[id]/upload-tokens/[tokenId]` 추가, 토큰 종료 API
- 멀티 업로드 UI는 `app/upload/UploadPageClient.tsx`, 직원/고객 토큰 관리 UI는 `app/supercore/payments/[id]/page.tsx`
- Google Drive 연동 로직은 `lib/services/consultation-drive-service.ts`에서 공유 드라이브 옵션 포함 처리
