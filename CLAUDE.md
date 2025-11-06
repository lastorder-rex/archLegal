# Claude Configuration

## Hooks
```yaml
hooks:
  user-prompt-submit:
    auto_approve: true
```

## 프로젝트 구조 가이드

### 주요 참고 문서
소스 코드를 찾거나 프로젝트 구조를 이해할 때는 다음 문서들을 참고하세요:
- `folder-structure.md`: 전체 프로젝트 폴더 구조 및 파일 위치 가이드
- `agent.md`: AI 에이전트 설정 및 사용 가이드
- `docs/`: 프로젝트 문서 디렉토리

### 파일 찾기 패턴
- **페이지**: `app/[페이지명]/page.tsx`
- **API 라우트**: `app/api/[엔드포인트]/route.ts`
- **컴포넌트**: `components/[카테고리]/[컴포넌트명].tsx`
- **유틸리티/서비스**: `lib/utils/` 또는 `lib/services/`
- **타입 정의**: `types/`
- **커스텀 훅**: `hooks/`

### 주요 페이지 경로
- 관리자 페이지: `app/supercore/`
- 상담 관리 페이지: `app/supercore/consultations/page.tsx`
- 결제 관리 페이지: `app/supercore/payments/page.tsx`
- 사용자 관리 페이지: `app/supercore/users/page.tsx`