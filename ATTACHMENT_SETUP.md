# 첨부파일 기능 설정 가이드

## 1. Supabase 설정

### 1-1. 데이터베이스 마이그레이션 실행

Supabase Dashboard → SQL Editor에서 다음 순서로 실행:

1. **user_roles 테이블 생성**
```sql
-- 005_create_user_roles_table.sql 내용 실행
```

2. **Storage 버킷 및 RLS 정책 설정**
```sql
-- 006_setup_storage_for_attachments.sql 내용 실행
```

3. **consultations 테이블에 attachments 컬럼 추가**
```sql
-- 007_add_attachments_to_consultations.sql 내용 실행
```

### 1-2. 임시 관리자 설정

1. 카카오 로그인 후 `/api/debug/user-info` 접속하여 사용자 ID 확인
2. Supabase Dashboard → SQL Editor에서 관리자 권한 부여:
```sql
INSERT INTO user_roles (user_id, role, created_by)
VALUES ('확인한_사용자_ID', 'admin', 'manual_setup');
```
3. 보안상 디버그 API 삭제: `rm -rf app/api/debug`

## 2. 기능 확인사항

### 2-1. 파일 업로드 기능
- [x] 드래그 앤 드롭 업로드
- [x] 클릭하여 파일 선택
- [x] 파일 형식 검증 (JPG, PNG, PDF, DOC, DOCX, HWP)
- [x] 파일 크기 제한 (10MB)
- [x] 최대 3개 파일 제한
- [x] 이미지 자동 리사이징 (1200px 기준)

### 2-2. 보안 기능
- [x] RLS 정책으로 접근 제어
- [x] 사용자별 폴더 분리
- [x] 관리자 권한 확인
- [x] Signed URL로 임시 다운로드 링크

### 2-3. UI/UX 기능
- [x] 파일 미리보기 (이미지)
- [x] 업로드 진행상황 표시
- [x] 파일 아이콘 표시
- [x] 파일 크기 포맷팅
- [x] 상담 내역에서 첨부파일 다운로드

## 3. 테스트 절차

### 3-1. 기본 업로드 테스트
1. `/request` 페이지에서 상담 작성
2. 첨부파일 영역에 파일 드래그 또는 클릭 선택
3. 다양한 파일 형식 업로드 시도
4. 파일 크기 제한 테스트 (10MB 초과 파일)
5. 최대 3개 파일 제한 테스트

### 3-2. 보안 테스트
1. 다른 사용자로 로그인하여 파일 접근 시도
2. 직접 URL 접근 시도
3. 관리자 권한으로 모든 파일 접근 확인

### 3-3. 다운로드 테스트
1. `/request/history` 페이지에서 첨부파일 확인
2. 다운로드 버튼 클릭하여 파일 다운로드
3. 다운로드된 파일 무결성 확인

## 4. 파일 구조

### 4-1. Storage 경로
```
consultation-attachments/
  └── {user_id}/
      └── {consultation_id}/
          ├── 20241001_위임장.jpg
          ├── 20241001_인감증명서.pdf
          └── 20241001_기타서류.hwp
```

### 4-2. 데이터베이스 저장 형태
```json
{
  "attachments": [
    {
      "name": "위임장.jpg",
      "size": 2048576,
      "type": "image/jpeg",
      "storagePath": "user123/consultation456/20241001_위임장.jpg"
    }
  ]
}
```

## 5. 문제 해결

### 5-1. 업로드 실패
- Storage 버킷 존재 확인
- RLS 정책 설정 확인
- 파일 크기 및 형식 확인

### 5-2. 다운로드 실패
- 사용자 권한 확인
- 파일 경로 확인
- Signed URL 생성 확인

### 5-3. 권한 오류
- user_roles 테이블에 올바른 권한 설정 확인
- RLS 정책 작동 확인

## 6. 향후 개선사항

- [ ] 관리자 전용 로그인 시스템
- [ ] 파일 압축/최적화 개선
- [ ] 대용량 파일 지원
- [ ] 파일 미리보기 확장
- [ ] 감사 로그 시스템