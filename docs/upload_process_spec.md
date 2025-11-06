# Upload Process Overview
- 업로드 플로우는 결제 요청 → 폴더 보장 → 토큰 발급 → 토큰 검증 → 파일 업로드/삭제 순서로 진행
- 고객용(위임장/인감증명서)·직원용(현장 실사) 토큰을 audience별로 분리 발급하며 폴더당 최대 4개 파일까지 지원
- 업로드 시 Google Drive 파일명 `{분류}_{이름}_{타임스탬프}` 자동 생성 및 `upload_logs`에 토큰/파일 매핑 저장
- Dry Run(`DRIVE_DRY_RUN`) 시 실제 드라이브 작업 없이 로그/메타데이터만 기록해 테스트 가능
- 만료/취소 토큰은 관리자 페이지에서 즉시 종료(PATCH) 및 복사 제한

# Token Rules
- 고객용: 상담 기준, 결제 ID 없음 → 토큰 ID/값으로 로그 조회
- 직원용: 결제 단계 기준, payment_id로 로그 조회
- 활성 토큰이 존재하면 동일 audience 토큰 생성 버튼 비활성화
- 토큰 종료(PATCH `/api/admin/payments/[id]/upload-tokens/[tokenId]`)로 `status=revoked`
- **토큰이 만료·종료되어 재발급되면 기존 토큰 문자열과 일치하는 행만 새 토큰 값으로 업데이트**

# Google Drive
- **공유 드라이브 운영**: 공유 드라이브 전용이며 서비스 계정은 대상 드라이브 관리자 권한을 보유해야 함. 모든 Drive API 호출에 `supportsAllDrives`와 필요 시 `driveId`를 적용.
- **폴더 생성 타이밍**: 결제 요청 생성 시 상담/결제 정보를 기준으로 고객 폴더를 보장하고, 결제 완료까지 동일 폴더를 사용해 업로드 토큰과 연결.
- **폴더 템플릿 구성**: 상담/결제 기준으로 생성된 고객 폴더 하위에 `1. 인감증명서`, `2. 위임장`, `3. 현장 실사` 템플릿만 활성화 상태에 따라 생성. 템플릿 목록은 DB에서 관리.
- **중복 처리 규칙**: 동일 이름 폴더가 존재하면 휴대폰 숫자(또는 타임스탬프) 접미사를 부여해 충돌 제거. 파일 업로드 시 동일 파일명은 삭제 후 재업로드해 덮어쓰기 시나리오를 명시적으로 처리.
- **메타데이터 관리**: 생성된 폴더 ID 및 메타데이터는 `consultation_drive_folders` 테이블에 업서트하며 Dry Run 모드에서도 데이터는 남김.
- **폴더 요약 API**: 하위 폴더와 루트 파일 존재 여부를 검사해 관리자 UI에 노출, 업로드 진행 상황을 요약 표시.
- **드라이브 업로드 유틸**: `uploadFileToDriveFolder`가 Drive 파일 업로드를 담당하고, 삭제 요청 시 Drive 파일과 Supabase 썸네일을 모두 제거.

# Front & API
- 업로드 페이지: 폴더별 멀티 업로드 UI, drag & drop + 삭제 지원
- `/api/upload/validate` 매 호출 시 Supabase 최신 로그/토큰 상태 조회
- `/api/upload/files` 단건 업로드, 10MB 제한, 업로드 후 컨텍스트 갱신 반환
- 관리자: 토큰 생성/종료/복사, 만료된 토큰은 세컨드 컬러로 표시

# 결제 연계 업로드 흐름
1. **결제 요청 생성**
   - 관리자 API `POST /api/admin/consultations/[id]/payment-request`가 결제 단계를 `awaiting` 상태로 만들며 `ensureConsultationDriveFolder` 실행.
   - `ensureConsultationDriveFolder`는 Google 공유드라이브에 `고객명(금액)_주소` 규칙의 루트 폴더와 템플릿별 서브폴더를 생성하고, 메타데이터를 `consultation_drive_folders` 테이블에 업서트.
   - 중복 폴더명이 감지되면 전화번호 숫자 또는 타임스탬프를 접미사로 붙여 충돌 제거. Dry run 모드에서는 실제 드라이브 작업 없이 메타데이터만 기록.

2. **결제 완료 처리**
   - `PATCH /api/admin/payments/[id]`에서 `action=markPaid`가 호출되면 `user_payment_stages` 상태가 `paid`로 갱신되고, 완료 알림이 `payment_notifications`에 기록.
   - 폴더 생성은 이전 단계에서 이미 완료되었으므로, 상신된 결제 단계는 이후 업로드 토큰 발급의 기준이 됨.

3. **업로드 토큰 발급**
   - 관리자가 `POST /api/admin/payments/[id]/upload-tokens` 호출 시 활성(미만료) 토큰을 정리한 뒤 새 토큰을 발행.
   - 생성된 토큰은 `upload_tokens`에 저장되며 만료시각, audience, 허용 템플릿, 폴더 ID, 업로드 제한 등을 포함. 링크는 `/upload?token=...` 형태로 사용자에게 전달.
   - 기존 동일 audience 토큰이 있다면 `upload_logs`의 `upload_token` 값을 새 토큰으로 재매핑해 파일 이력 일관성을 유지.

4. **토큰 검증 및 컨텍스트 로딩**
   - 사용자가 업로드 링크를 열면 `GET /api/upload/validate`가 `resolveUploadContext`를 통해 토큰 상태, 상담 정보, 결제 단계, `consultation_drive_folders.metadata`의 서브폴더 목록, `upload_logs`를 한번에 조합해 반환.
   - 반환 데이터는 업로드 UI에서 폴더별 남은 슬롯, 업로드 내역, Dry run 표시 등에 사용.

5. **파일 업로드**
   - `UploadPageClient`는 2MB 초과 이미지에 대해 리사이즈·재압축(HEIC/HEIF→JPEG 변환 포함) 후 FormData를 `POST /api/upload/files`로 전송해 Vercel 본문 제한을 회피.
   - API는 토큰/템플릿/슬롯 검증 후 `uploadFileToDriveFolder`로 Google Drive에 업로드하고, 결과를 `upload_logs`에 남기며 토큰의 `updated_at`을 갱신.
   - **썸네일 생성**: 이미지 파일인 경우 `sharp`로 200x200px JPEG 썸네일을 생성하고, Supabase Storage의 `thumbnails` 버킷(public)에 `consultations/{consultation_id}/{timestamp}.jpg` 경로로 업로드. 생성된 public URL을 `upload_logs.thumbnail_url`에 저장해 모바일 환경에서도 인증 없이 미리보기 가능.
   - 삭제 요청(`DELETE /api/upload/files`)은 동일 검증 후 Drive 파일과 Supabase Storage 썸네일을 모두 제거하고 `upload_logs`에서 삭제.

# 관련 코드 위치
- `app/api/upload/`: 파일 업로드/삭제/검증 API 라우트
- `app/api/admin/payments/`: 결제 단계/업로드 토큰 관리 API
- `app/upload/`: 업로드 페이지(App Router) 및 클라이언트 컴포넌트
- `lib/services/upload-context.ts`: 업로드 컨텍스트 조합 및 캐싱 로직
- `lib/utils/file-upload.ts`: 파일 리사이즈, 확장자 처리, 슬롯 검증 유틸
- `supabase/` 마이그레이션: `consultation_drive_folders`, `upload_tokens`, `upload_logs` 테이블 정의
