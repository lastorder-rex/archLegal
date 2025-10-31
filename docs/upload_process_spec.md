# Upload Process Overview
- 고객용(위임장/인감증명서)·직원용(현장실사) 토큰을 분리 발급
- 폴더당 최대 4개, 멀티 업로드·드래그 지원
- 업로드 시 Google Drive 파일명 `{분류}_{이름}_{타임스탬프}` 자동 생성
- `upload_logs`에 토큰/파일 매핑 저장, **토큰이 만료·종료되어 재발급되면 기존 토큰 문자열과 일치하는 행만 새 토큰 값으로 업데이트**
- 만료/취소 토큰은 관리자 페이지에서 즉시 종료(PATCH) 및 복사 제한

# Token Rules
- 고객용: 상담 기준, 결제 ID 없음 → 토큰 ID/값으로 로그 조회
- 직원용: 결제 단계 기준, payment_id로 로그 조회
- 활성 토큰이 존재하면 동일 audience 토큰 생성 버튼 비활성화
- 토큰 종료(PATCH `/api/admin/payments/[id]/upload-tokens/[tokenId]`)로 `status=revoked`

# Front & API
- 업로드 페이지: 폴더별 멀티 업로드 UI, drag & drop + 삭제 지원
- `/api/upload/validate` 매 호출 시 Supabase 최신 로그/토큰 상태 조회
- `/api/upload/files` 단건 업로드, 10MB 제한, 업로드 후 컨텍스트 갱신 반환
- 관리자: 토큰 생성/종료/복사, 만료된 토큰은 세컨드 컬러로 표시

# Google Drive
- **공유 드라이브 전용**, 서비스 계정은 해당 드라이브의 관리자 권한을 보유해야 함
- `supportsAllDrives`, `driveId` 동적 적용으로 Drive API 호출
- 폴더 생성 시 템플릿 목록 DB 기반, 중복명은 휴대폰 접미사로 처리
- Dry Run 모드(`DRIVE_DRY_RUN`)는 실제 업로드 대신 로그만 남김
