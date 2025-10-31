# Google Drive Folder Workflow
- 결제 완료 시 상담/결제 기준으로 고객 폴더 생성 (`sanitize`, 중복 시 휴대폰 접미사)
- 하위 템플릿: `1. 인감증명서`, `2. 위임장`, `3. 현장 실사` (DB 관리, 활성 템플릿만 생성)
- 공유 드라이브 대응: `supportsAllDrives`, 필요 시 `driveId` 자동 주입
- 업로드 시 동일 파일명은 삭제 후 업로드(덮어쓰기 semantics)
- `consultation_drive_folders`에 폴더 ID/메타데이터 저장, Dry Run 모드 지원
- 폴더 요약 API는 하위 폴더/루트 파일 존재 여부 검사 후 관리자 UI에 노출
