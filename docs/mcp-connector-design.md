# 양성화.com GPT/Claude 커넥터 · MCP 구성 설계서

> 상태: **설계 초안 (개발 전)**. 현재 eais-agent 발급/HTML/드라이브 작업을 먼저 마무리한 뒤 착수.
> 작성 기준일: 2026-06-24. 초안(사용자) + 리뷰 제안(통합본).

---

## 1. 목표

양성화.com/rex의 **상담글** 또는 사용자가 **GPT/Claude 앱에서 직접 입력한 주소**를 기반으로 세움터 건축물대장(표제부/전유부/일반건축물/총괄표제부) **발급 요청을 생성**하고, **맥미니의 eais-agent**가 실제 세움터 브라우저 자동화로 PDF를 발급 → HTML 신고서 생성 → 드라이브 업로드 → **메일 발송**까지 처리한다.

사용자는 핸드폰 ChatGPT/Claude 앱에서 자연어로 요청한다.

예:
- “오늘 발급할 대상 뽑아줘”
- “1번, 3번 발급 요청해줘”
- “구로구 오류동 156-144 표제부 발급해줘”
- “서울시 … 101동 501호 전유부 발급해줘”

---

## 2. 핵심 전제

- 관리자 페이지를 GPT가 클릭하는 방식이 **아니다.**
- rex에 **원격 MCP 서버 1개**를 만들고, ChatGPT/Claude가 MCP tool을 호출 → rex 백엔드(인증/권한/DB/API)가 발급 후보 조회·요청 생성을 처리.
- **실제 세움터 발급은 맥미니 eais-agent**가 담당(Playwright 필요 → 서버에서 불가).
- **MCP 서버는 ChatGPT·Claude 공용 1벌.** MCP는 표준 프로토콜이라 클라이언트별로 서버/툴을 따로 만들 필요 없음. 등록·OAuth 절차만 클라이언트마다 별도.

> ⚠️ **착수 전 검증 필수**: 현재 ChatGPT가 **커스텀 "쓰기" 툴(write action)** 을 모바일/커넥터에서 허용하는지 확인. 요금제/개발자모드 제약, 일부 모드는 search/fetch만 허용될 수 있음. → **Claude 커넥터를 병행 타깃**으로(대체로 더 관대).

---

## 3. 전체 구조

```text
ChatGPT 앱 / Claude 앱
  │  (remote MCP, OAuth)
  ▼
rex MCP 서버  ── 인증/권한/구독/감사로그
  ▼
issue_requests 큐 (Supabase, RLS)
  ▲                         │ (outbound polling, 워커 토큰)
  │ 상태/결과 갱신           ▼
맥미니 eais-agent worker (상시 실행)
  ▼
세움터 브라우저 자동화 (Playwright)
  ▼
PDF 발급 → HTML 신고서 렌더 → Google Drive 업로드 → 메일 발송
```

- **맥미니는 rex를 아웃바운드로 폴링/claim/update** → NAT 뒤에 있어도 inbound 포트/터널 불필요.
- rex↔워커 채널은 **사용자 OAuth와 별개의 워커 전용 서비스 토큰**.

---

## 4. 프로젝트 역할 분리

### rex (MCP 서버 측)
- ChatGPT/Claude MCP endpoint 제공 (Next.js API route, remote/streamable HTTP)
- 사용자 인증/OAuth, 관리자 권한, 구독/과금 상태 확인
- 상담글 기반 발급 후보 조회
- 주소 직접 입력 발급 요청 생성
- 발급 요청 큐 관리·상태 관리
- 결과 파일(메타) 관리, 감사 로그
- **워커용 내부 API**(claim/heartbeat/complete) — 워커 토큰 인증

### eais-agent (맥미니 워커 측) — MCP 아님
- 맥미니 상시 실행, rex 큐 **폴링 → claim**
- Playwright로 세움터 로그인/주소검색/발급(표제부·전유부·일반·총괄)
- `auto`면 **워커가 대장종류 판정**(detectCounts/classifyBuilding), 다중동이면 총괄+동표제부
- HTML 신고서 생성 + 신고서 PDF 렌더
- **Google Drive 업로드(상담글/테넌트별 폴더)** + **메일 발송**
- rex에 결과·상태 갱신, **하트비트** 전송

---

## 5. 커넥터 개념 (별도 앱 아님)

“양성화 앱”이 아니라 ChatGPT/Claude 안에서 연결되는 **“양성화 커넥터”**.

```text
앱 실행 → 양성화 커넥터 연결 → 양성화.com 계정 로그인(OAuth)
→ 발급 요청(자연어) → MCP가 rex에 요청 생성 → 맥미니가 세움터 발급 → 결과 메일/링크
```

초기엔 비공개/개발자 모드로 테스트, 이후 제한 고객용 → 공개로 확장.

---

## 6. MCP Tool 설계

### list_issue_candidates
상담글 중 발급 후보 조회.
```json
// in
{ "dateRange": "today", "status": "needs_issue" }
// out
{ "candidates": [
  { "id": "consult_123", "address": "서울시 구로구 …",
    "recommendedDocType": "auto", "customerName": "홍길동",
    "reason": "상담글에 주소 있음, 발급 이력 없음" }
]}
```

### create_issue_requests
상담글 후보 ID로 발급 요청 생성.
```json
{ "candidateIds": ["consult_123","consult_456"], "docType": "auto",
  "idempotencyKey": "..." }
```

### create_manual_issue_request
직접 입력 주소로 발급 요청 생성.
```json
{ "address": "서울시 구로구 오류동 156-144", "docType": "표제부",
  "dongHo": "", "deliverEmail": "user@x.com", "idempotencyKey": "..." }
```
전유부:
```json
{ "address": "서울시 …", "docType": "전유부", "dongHo": "101동 501호" }
```
**모호하면 발급 생성하지 않고 후보 반환**(되묻기 — §6.1):
```json
// 호 미지정/모호 시 응답
{ "status": "needs_choice", "reason": "전유부 호 미지정",
  "units": [{ "dong": "", "ho": "101" }, { "dong": "", "ho": "201" }] }
```

### list_units  *(신규 — 전유부 호 목록 조회, 발급 안 함)*
주소의 발급 가능 단위(전유부 동/호, 다중동 표제부 동)를 조회. **모호성 되묻기용.**
```json
// in
{ "address": "영등포구 양평동1가 2-1", "docType": "전유부" }
// out
{ "units": [
  { "dong": "", "ho": "101" }, { "dong": "", "ho": "102" }, { "dong": "", "ho": "201" }
], "count": 12 }
```
> 동/호 그리드 스캔(워커의 `selectJeonyuHo` Pass1 / `selectPyojebuDong` 재사용). 발급 비용 없음.

### get_issue_status
요청 진행 상태 조회.

### get_issue_result
완료된 결과(파일 메타/링크) 반환. **다중동이면 결과 파일 복수** → 배열.

### send_result_email  *(신규 — 메일 단계)*
발급 결과를 메일로 전송(또는 발급 완료 시 워커가 자동 발송 + 이 툴은 재발송용).
```json
{ "requestId": "req_…", "to": "user@x.com", "attachPdf": true }
```

> tool 설명문(description)은 LLM이 정확히 호출하도록 명확하게 작성. 발급은 비용/기록이 남으므로 **실행 전 사용자 확인** 단계 권장.

### 6.1 모호성 처리 — "후보 반환 → 되묻기" (대화형 핵심)

전유부는 호가 여러 개라 **하나로 특정 못 하면 발급하면 안 된다.** 핵심 설계:
**되묻기는 MCP/워커가 아니라 LLM(Claude/GPT 앱)이 한다.** 툴은 후보만 돌려주면, 앱이 알아서 사용자에게 묻는다(별도 UI 불필요 — MCP의 강점).

```text
"양평동1가 2-1 전유부 발급해줘"
 → create_manual_issue_request (호 미지정)
 → 발급 안 함, status: needs_choice + units[] 반환
 → Claude/GPT 앱: "어느 호로 할까요? 101 / 201 / …" 되물음
 → 사용자: "201호"
 → create_manual_issue_request (dongHo:"201") → 실제 발급
```

판정 규칙(워커/툴 공통, 기존 `selectJeonyuHo` 로직 재사용):
- 호 **명확(단일 일치)** → 바로 발급
- 호 **미지정 / 여러 호 / 여러 동에 동일 호** → `needs_choice` + `units[]`
- 전유부가 **1건뿐**이면 되묻지 않고 자동 확정
- 다중동 표제부도 동일: 동 미지정 시 동 목록 되묻기(단, 표제부 전체개요는 총괄 병합으로 대체 가능)

**경로별 차이:**
| 경로 | 모호할 때 |
|---|---|
| 폰 앱(MCP) / 대화형 | `needs_choice` → **LLM이 되묻기** ✅ |
| 엑셀 배치 | 되물을 수 없음 → **호 컬럼 필수**, 없거나 모호하면 해당 행 `needs_호`로 **에러/스킵 + 로그**(자동 추측 금지) |

---

## 7. DB 모델 (Supabase, RLS + service_role)

```text
issue_requests
- id (uuid pk)
- tenant_id            -- MVP 단일테넌트면 기본값 1개로 시작
- requested_by_user_id
- source               -- consultation | manual
- consultation_id      -- nullable
- address
- doc_type             -- auto | 표제부 | 전유부 | 일반건축물 | 총괄표제부
- resolved_doc_type    -- 워커가 auto 판정 후 확정값 기록  ← 추가
- dong_ho              -- nullable
- status               -- pending | running | done | failed | cancelled
                       --  (claimed는 running+started_at으로 대체 가능)
- worker_id            -- nullable
- lease_until          -- 가시성 타임아웃: 지나면 재큐  ← 추가
- heartbeat_at         -- 워커 생존 신호  ← 추가
- idempotency_key      -- 중복 발급 방지(unique)  ← 추가
- result_files (jsonb) -- [{type:pdf|html|신고서, drive_id, link, name}]  ← 단일 url 대신 배열
- deliver_email        -- nullable
- email_sent_at        -- nullable  ← 메일 단계
- error_message        -- nullable
- created_at / started_at / completed_at
```

- RLS로 테넌트/사용자 격리, **워커는 service_role**로 claim/update (rex 기존 admin 테이블 패턴과 일치).

---

## 8. 워커 동작 (안정성 핵심)

1. **원자적 claim**: `FOR UPDATE SKIP LOCKED` 또는 Supabase RPC로 pending 1건 → running + worker_id + lease_until 설정. (동시/중복 claim 방지)
2. **하트비트**: 처리 중 주기적으로 heartbeat_at/lease_until 갱신.
3. **좀비 복구**: lease_until 지난 running은 rex가 pending으로 재큐(워커 다운 대비).
4. **멱등성**: idempotency_key unique로 같은 요청 중복 발급 차단.
5. 발급→HTML→PDF렌더→Drive업로드→메일 후 status=done + result_files + email_sent_at.
6. 실패 시 status=failed + error_message + 스크린샷 보관.
7. (나중) 폴링 → **Supabase Realtime 구독**으로 전환해 지연 감소. MVP는 폴링+백오프(3~5초).

---

## 9. 보안/권한

- 양성화.com **OAuth 로그인**(커넥터), 사용자별 tenant_id 매핑
- 관리자 권한·구독/결제 상태·발급 가능 범위 확인
- **워커 전용 서비스 토큰**(OAuth와 분리)
- 발급 요청 **감사 로그**
- 실제 발급 생성 전 **사용자 확인**
- **세움터 계정 공유/대리발급 구조 주의** — 단일 세움터 계정으로 타인 업무 대리발급은 공개 SaaS 시 **약관/법률 회색지대**(MVP 내부/본인용은 OK, 5단계 전 검토)
- 캡차/추가 인증 **우회 금지**
- **결과 전달**: 공유드라이브(계정권한 제한)는 일반 고객이 링크를 못 엶 → **메일 첨부가 실질 전달수단**. Drive=보관, 메일=전달.

---

## 10. MVP 순서

**1단계** — 주소 직접 입력 e2e (가장 먼저)
```text
GPT/Claude → create_manual_issue_request → rex 큐 → 맥미니 발급 → Drive 업로드 → 메일
```
> 속도 우선: 1단계는 **OAuth 생략, 단일 사용자(본인) 토큰**으로 e2e 검증 → 동작 후 4단계에서 OAuth/멀티테넌트.

**2단계** — 상태/결과 조회: `get_issue_status`, `get_issue_result` + **전유부 되묻기**(`list_units` / `needs_choice`, §6.1)

**3단계** — 상담글 후보: `list_issue_candidates`, `create_issue_requests`

**4단계** — OAuth, 구독/과금, 사용자별 권한, tenant 격리

**5단계** — 제한 고객용 → 공개 커넥터(법률 검토 후)

---

## 11. 핵심 결론

- **MCP 서버는 rex에 1개** (ChatGPT·Claude 공용). eais-agent는 MCP가 아니라 **맥미니 발급 worker**.
- ChatGPT/Claude는 세움터를 직접 조작하지 않음 → MCP로 rex에 요청 생성, 실제 발급은 맥미니.
- 초안 대비 **반드시 추가할 3가지**: ① **메일 발송 단계**(send_result_email/자동발송) ② **워커 인증 토큰** ③ **claim 원자성 + 좀비 복구(lease/heartbeat)**.
- 그 외 권장: 멱등성 키, resolved_doc_type, result_files 배열, tenant/상담글별 Drive 폴더, RLS+service_role, MVP는 OAuth 후순위.
- **모호성 되묻기(§6.1)**: 전유부 호 미지정/다중 시 발급 말고 `needs_choice`+후보 반환 → LLM이 되묻기. 엑셀은 호 필수·모호행 스킵.
- **착수 전 1가지 검증**: ChatGPT 커스텀 쓰기 툴 가능 여부(안 되면 Claude 우선).

---

## 12. 재사용 가능한 기존 자산 (이미 구현됨, eais-agent)

- 발급: `src/poc/issue.mjs` — `createContext`/`ensureLogin`/`issueOne`(counts 반환), 표제부/전유부/일반/총괄, 단일/다중동
- HTML 생성·PDF 렌더: `src/permit/overview/generate.mjs` — `parsePdf`/`writeHtml`/`mergeChonggwalPyojebu`/`renderHtmlToPdf`, 3대장양식 지원
- 발급→HTML→PDF→업로드 파이프라인: `src/permit/overview/pipeline.mjs`
- 드라이브: `src/common/drive.mjs` — `uploadFile(s)`/`ensureFolder`/`listFolder`/`downloadFile` (공유드라이브, 주소별 폴더)
- **메일 발송은 아직 없음** → rex 메일 인프라(SMTP/SendGrid/Gmail API) 유무 확인 후 추가 필요.

→ 워커는 위 함수들을 큐 처리 루프로 감싸기만 하면 됨.
