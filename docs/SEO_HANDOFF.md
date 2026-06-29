# SEO·웹 유입 인수인계 (jake 세션 → rex 세션)

> 2026-06-20, jake(`/Users/kbsc/jake`, Expo 앱) 작업 중 나눈 논의를 rex로 넘기는 문서.
> rex에서 새 Claude 세션을 시작하면 이 파일을 먼저 읽혀서 맥락을 이어가면 된다.

## 0. 한 줄 요약

**"이행강제금 계산기" 검색 유입은 Expo 웹이 아니라 여기 rex(Next.js)에 실제 텍스트 콘텐츠 + sitemap으로 만들어야 한다."** 네이버가 JS로 그려지는 SPA(Expo 웹)를 못 읽기 때문.

## 1. 배경 — 제품 구조

- **jake** = Expo(React Native) 앱. 화면: ① 이행강제금 계산기 ② 1분 자가진단(위반건축물 양성화 가능성). 계산은 100% 오프라인 엔진.
- **rex**(이 저장소) = Next.js 백엔드(BFF). jake가 호출하는 정부 API 프록시(주소검색/공시지가/건축물대장/위반여부). 운영: `https://www.archlegal.co.kr` (가동 확인됨).
- 사업 구조상 계산기·자가진단은 **퍼널 입구(미끼)** — 위반건축물 가진 사람을 찾아 → 향후 **양성화 서비스**(만들 예정)로 연결하는 그림.

## 2. 핵심 결정 — 왜 SEO를 rex에서 하나

- Expo 웹 빌드 = **클라이언트 렌더 SPA**. 첫 HTML은 빈 `<div>`, 내용은 JS가 그림.
  - 구글: JS 실행해 일부 읽음(불완전). **네이버: JS 거의 못 읽음 → 사실상 미노출.**
- 따라서 "Expo 코드 재사용하면 웹 SEO 공짜"는 **오답**. 사용 가능한 웹페이지는 되지만 검색용은 아님.
- rex는 **Next.js(SSR/SSG)** = 서버에서 HTML에 텍스트까지 채워 내보냄 → **SEO에 최적**. sitemap/메타/OG 다 지원.
- 결론 구조:
  | 무엇 | 어디 |
  |---|---|
  | 설치형 앱(안드/iOS) | Expo(jake) |
  | **검색용 웹 + 계산기** | **rex(Next.js)** ⭐ |

## 3. rex에서 할 SEO 작업 체크리스트

- [ ] **실제 텍스트 콘텐츠 페이지** (가장 중요) — 검색되는 건 결국 글:
      "이행강제금이란?", "위반건축물 양성화 절차", "이행강제금 계산 방법/사례" 등.
      각 글 끝에서 웹 계산기/자가진단으로 유도(CTA).
- [ ] **웹 계산기 페이지** — jake 계산 로직을 rex에 이식하거나 별도 구현(엔진은 순수 TS라 이식 가능).
- [ ] **sitemap.xml** + **robots.txt** (Next.js `app/sitemap.ts`, `app/robots.ts`로 생성)
- [ ] **메타데이터**(title/description) + **OG 태그** — 페이지별 (Next.js `generateMetadata`)
- [ ] **네이버 서치어드바이저** 사이트 등록 + 소유 확인(메타태그 or 파일) → sitemap 제출
- [ ] **구글 Search Console** 등록 + sitemap 제출
- [ ] 구조화 데이터(JSON-LD) 선택적 — FAQ/Article 스키마

## 4. 마케팅 전략 요약 (논의된 것)

- 일반 소비자 앱처럼 "관심 끌기" 싸움이 아니라 **"검색당하기"** 싸움. 의도(intent) 강한 니치.
- 채널 우선순위: **검색/SEO > 네이버 카페·블로그 > 행정사·건축사·중개사 B2B 제휴 > 검색광고.**
- 유입경로(채널)는 로그인 없이 **UTM·추천코드 + 익명 분석**으로 먼저 측정. 큰돈/로그인 투입 전에 싼 실험으로 뭐가 먹히는지 확인.

## 5. 로그인(카카오) 결정

- **입구·주소단계에서 막지 말 것**(이탈↑). 붙인다면 **결과 화면의 "저장/다음 액션" 버튼** = 관심 최고점.
- 로그인의 고유 가치는 채널이 아니라 **identity(리드 식별·전환 추적)**. → **양성화 서비스 만들 때 같이 도입**이 적절. 그 전엔 관리비용(개인정보 보유·회원탈퇴 의무)만 생김.
- jake 코드는 이미 대비됨: `src/navigation/types.ts`(Login 라우트 자리), `src/storage/recent.ts`(서버 동기화로 교체 전제).

## 6. 참고 — jake 현황(연동 맥락)

- jake EAS 빌드 세팅 완료(Expo 계정 `jake-rex`, 안드 preview apk 빌드 성공). 식별자 `kr.co.archlegal.finecalc`.
- jake가 호출하는 rex 엔드포인트: `/api/juso/search`, `/api/land-price`, `/api/building/title`, `/api/building/expose`, `/api/building/violation`.
- jake 개인정보처리방침 초안: `jake/PRIVACY.md` (로그인 도입/콘텐츠 수집 시 개정 필요). 스토어 제출용으로 **rex에 `/privacy` 페이지 호스팅** 필요.
