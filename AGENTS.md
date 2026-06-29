# Codex Configuration

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

## 위반건축물 데이터 수집 (재사용 절차)

사용자가 "○○구/○○ 추출해줘"처럼 **짧게** 지시하면 긴 설명 없이 바로 이 절차로 진행한다.

- **스크립트:** `scripts/collect-violations.mjs` (rex 루트에서 실행)
- **동작:** VWorld 시군구경계(lt_c_adsigg)에서 대상 시도 구 목록·bbox 자동조회 → 구별 쿼드트리로 `lt_c_bldginfo`(viol_bd_yn=1) 수집 → 법정동명 역지오코딩 → Supabase `public.violation_buildings`에 **pnu 기준 upsert(멱등)**. 이미 적재된 구는 자동 skip, 한 구 실패해도 다음 구 계속.

```sh
node scripts/collect-violations.mjs            # 기본=서울 전 구 (SIDO=11)
ONLY=11680 node scripts/collect-violations.mjs # 특정 구만 (sigungu_cd 5자리, 쉼표로 여러개)
SIDO=41 node scripts/collect-violations.mjs    # 다른 시도 전체 (41=경기)
FORCE=1 ONLY=11680 node ...                    # 이미 적재된 구 강제 재수집
```

- **시도코드:** 11서울 26부산 27대구 28인천 29광주 30대전 31울산 36세종 41경기 42강원 43충북 44충남 45전북 46전남 47경북 48경남 50제주
- **⚠️ 실행 주체:** 운영 Supabase 쓰기가 에이전트 환경에서 차단되므로 **수집 스크립트는 사용자가 직접 터미널에서 실행**한다. 에이전트는 ①정확한 명령 한 줄 제시 ②적재 후 `localhost:3002/map` 브라우저 검증을 담당.
- **상태(2026-06-19):** 서울(SIDO=11) 25개 구 전부 적재 완료(≈37,899건). 서울 재실행 시 전부 skip. 다음 확장 후보는 다른 시도(SIDO 변경).