# request.md

## 📌 상담문의 등록폼 개발 정의서

### 0) 범위 (MVP)

-   기존 배포(`main`)는 유지.\
-   별도 브랜치 `feature/request-form`에서 **임시 페이지** `/request`를
    만들어 독립 개발/검증.\
-   행안주 주소 검색은 주소검색 팝업으로 이용한다.    
-   기능 범위: 카카오 로그인 사용자 닉네임 자동입력 → 주소검색(Juso)  →
    건축물대장 API 호출 → DB 저장(JSONB+핵심필드).\
-   카카오 비니지스 채널 생성 승인 완료 되면 카카오 간편가입 신청하여 정보 가져 올 계획    
-   알림톡 발송은 차순위.

------------------------------------------------------------------------

### 1) 기술 스택 & 구조

-   Next.js (App Router) + TypeScript\
-   Supabase (PostgreSQL + RLS)\
-   서버 API Route 통해 Juso/건축물대장 API 호출 (키 노출 방지)\
-   Validation: Zod\
-   상태관리: React state

------------------------------------------------------------------------

### 2) 환경변수 (.env.local / Vercel)


# Juso (행안부 도로명주소 API)
JUSO_API_KEY=U01TX0FVVEgyMDI1MDkyNjExNTgwODExNjI2OTQ=

# 국토교통부 건축물대장 API
BLD_RGST_API_KEY=3b4110d3a8421692995e1f0a86454f0f6c77a5f92d0f96a22f816ca7f1e70530


------------------------------------------------------------------------

### 3) DB 설계 (Supabase)

``` sql
create extension if not exists "pgcrypto";

create table if not exists consultations (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  nickname text,
  name text,
  phone text not null,
  email text,
  address text not null,
  address_code jsonb,
  building_info jsonb,
  main_purps text,
  tot_area numeric,
  plat_area numeric,
  ground_floor_cnt int,
  message text,
  created_at timestamp with time zone default now()
);

alter table consultations enable row level security;

create policy "consultations_insert_authenticated"
on consultations
for insert
to authenticated
with check (true);
```

------------------------------------------------------------------------

### 4) API 설계

#### 4.1 주소 검색 (Juso)
-   `POST /api/juso/search`\
-   입력: `{ query, page }`\
-   출력: 후보 리스트(도로명, 지번, 시군구코드 등)

#### 4.2 건축물대장 조회

-   `POST /api/building/title`\
-   입력: `{ sigunguCd, bjdongCd, platGbCd, bun, ji }`\
-   출력: 원본 JSON + 파싱 필드(mainPurpsCdNm, totArea, platArea,
    groundFloorCnt)

#### 4.3 상담 등록

-   `POST /api/consultations`\
-   입력: 카카오 사용자 + 주소 + 건축물대장 데이터 + message\
-   출력: `{ ok: true, id: "uuid" }`

------------------------------------------------------------------------

### 5) 프론트엔드 (임시 `/request` 페이지)

-   닉네임/user_id 자동 입력\
-   이름, 연락처, 이메일 입력(이메일은 필수 아님)\
-   주소 검색 → 상세주소 선택 필수\
-   건축물대장 조회 버튼 → 요약 정보 표시\
-   제출 시 Supabase insert\
-   성공 메시지 → "정상 접수되었습니다."

------------------------------------------------------------------------

### 6) Validation

-   전화번호: 한국 휴대폰 패턴\
-   이메일(필수 아님): 형식 검증\
-   주소: Juso 검색 선택 완료해야 통과\
-   message: 최대 1000자

------------------------------------------------------------------------

### 7) 테스트 체크리스트

-   [ ] 로그인 사용자 닉네임 자동 입력 확인\
-   [ ] 주소검색 시 동 단위만 입력 → 검색 제한 동작\
-   [ ] 상세주소 선택 → 건축물대장 조회 성공\
-   [ ] Supabase insert 성공, JSONB 저장 확인\
-   [ ] 주요 필드(주용도, 연면적 등) 정상 파싱\
-   [ ] Validation 실패 시 에러 메시지 출력\
-   [ ] 네트워크/API 오류 시 사용자 안내 메시지 표시\
-   [ ] `/request`는 최종 머지 시 제거
