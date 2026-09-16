# 비공개 자료실 /case-room

rex 안의 비공개 자료 화면. 사이트 탐색 메뉴·sitemap에는 등록하지 않는다.

## 구조

- `app/case-room`: 개인정보 없는 동적 접속 화면 및 테마 토큰 기반 스타일.
- `components/private-case`: 비밀번호 입력, 메모리 내 데이터 표시, 자료 유형별 렌더링.
- `lib/private-case/server.ts`: bcrypt 검증, 8시간 HMAC 세션, 서버 전용 DB 조회.
- `/api/private-case/login`, `/data`, `/logout`: 모든 자료 조회에 세션 검증. 쿠키 존재만으로 통과시키지 않는다.
- 자료는 전용 사례연구 Supabase `private_case_staging`의 설정된 case_key와 허용 파일명으로만 조회한다. 파일별 최신 스냅샷을 표시한다. rex 운영 테이블을 사용하지 않는다.

## 서버 환경변수

Vercel의 해당 프로젝트 환경설정에 아래 여섯 값을 등록한다. `NEXT_PUBLIC_` 접두사를 붙이지 않는다.

| 변수 | 값 |
|---|---|
| PRIVATE_CASE_SUPABASE_URL | 전용 사례연구 DB URL |
| PRIVATE_CASE_SUPABASE_SERVICE_ROLE_KEY | 해당 DB 서버 전용 키 |
| PRIVATE_CASE_KEY | 표시 대상의 UUID |
| PRIVATE_CASE_PASSWORD_HASH | bcrypt 해시(cost 10~16) |
| PRIVATE_CASE_SESSION_SECRET | 암호학적 난수 32자 이상 |
| PRIVATE_CASE_ALLOWED_ORIGIN | 허용하는 정확한 접속 origin(예: https://www.archlegal.co.kr), 끝에 / 없이 |

로컬 `.env.local`은 설정 완료. 비밀번호 원문은 환경변수·코드에 저장하지 않는다. 로컬 dotenv 파일의 bcrypt `$`는 확장을 피하도록 이스케이프한다. Vercel 환경변수 UI에는 이스케이프 없는 실제 bcrypt 값을 넣는다. 비밀번호 해시 또는 세션 비밀을 바꾸면 이전 세션은 무효다.

## 로그인 시도 제한

`supabase/manual/private-case-login-limit.sql`만 전용 사례연구 DB에 수동 적용했다. 의료자료 변경은 없다. `db push`는 실행하지 않았다.

- 전 인스턴스·주소에 공유되는 case_key별 15분 15회 제한. 성공·실패 모두 포함.
- 제한 RPC 오류 시 로그인 503으로 차단한다. 메모리 제한으로 대체하지 않는다.
- 소수 사용자용 공용 비밀번호이며 개인별 계정/철회는 제공하지 않는다. 로그인 공격으로 제한이 소진되면 정상 사용자도 해당 창이 끝날 때까지 기다려야 한다.

## 공개 전 확인

1. 의료자료 내장 HTML/JSON, `.env.local`, 개인자료 폴더는 Git·public 폴더에 넣지 않는다.
2. 사용자 승인으로 정리 자료 7개를 전용 비공개 DB에 저장하고 원본 일치를 확인했다. DB에 없는 자료는 미등록 안내만 표시한다. 로컬 파일 폴백 없음.
3. Vercel 환경변수를 등록한 후 배포한다. HTTPS 운영 환경은 Secure + HttpOnly + SameSite Strict 쿠키를 사용한다.
4. 운영 주소에서 미인증 GET 401, 비밀번호 로그인, 로그아웃 후 401을 확인한다. API는 private/no-store, 세션 만료 시 화면 메모리도 지운다.
5. 공개 배포와 Git commit/push는 사용자 지시 후 수행한다. 이번 작업은 사용자 지시에 따라 운영 배포를 진행한다.
