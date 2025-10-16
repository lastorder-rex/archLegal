# Refactoring TODO

진행한 리팩토링과 앞으로 다듬어야 할 작업을 정리했습니다. 체크박스를 갱신하며 추적하세요.

## 완료 ✅
- [x] `AuthPanel`에서 이메일/비밀번호 로그인 로직 분리 (`usePasswordLogin` 훅) 및 세션 동기화 API 추가
- [x] `/api/consultations/[id]` PATCH/DELETE 라우트에 `withSupabaseAuth` 헬퍼 적용해 세션 중복 처리 제거
- [x] redirect 경로 정리를 위한 `sanitizeRedirectPath` 유틸 추가 및 로그인/회원정보 페이지에 반영

## 진행 예정 🔧
- [ ] 상담 내역 갱신 로직을 `useConsultationList`(가칭) 훅으로 분리해 MyPage/History에서 재사용
- [ ] `/request/history/page.tsx` 상태 관리를 훅 또는 React Query로 통합하고 `window.location.reload` 제거
- [ ] `MyPageShell` 탭 렌더링을 공용 컴포넌트/함수로 추출해 JSX 중복 제거
- [ ] API 입력 검증(Zod 등)과 서버 유틸 정리(예: 기타 라우트도 `withSupabaseAuth` 적용) 계획 수립
- [ ] 테스트 전용 로그인 플래그/스크립트 문서화 및 배포 환경에서의 사용 가이드 작성
- [ ] TODO(temporary-review-gate) 제거: 심사 비밀번호 모달과 관련 상태/스토리지 로직 삭제

필요한 항목이 생기면 자유롭게 추가하고, 완료 시 체크해 주세요.
