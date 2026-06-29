# EAIS MCP 다음 작업 체크리스트

이 파일은 임시 작업 메모다. 작업이 끝나면 삭제해도 된다.

## 현재 완료된 것

- Supabase SQL `048_create_eais_issue_jobs.sql` 적용 완료
- Supabase migration history에서 `048` applied 처리 완료
- rex에 EAIS job API 코드 추가
- rex에 MVP MCP endpoint 코드 추가
- eais-agent에 rex worker 코드 추가

## 절대 주의

아래 명령은 아직 실행하지 않는다.

```bash
npx supabase db push
```

현재 원격 Supabase migration history에서 `033~047`이 비어 있어, `db push`를 실행하면 의도하지 않은 migration들이 같이 적용될 수 있다.

## 1. rex 환경변수 추가

파일:

```text
/Users/kbsc/rex/.env.local
```

아래 값을 추가한다.

```env
EAIS_WORKER_TOKEN=여기에_랜덤값_A
MCP_SHARED_TOKEN=여기에_랜덤값_B
MCP_DEFAULT_ADMIN_ID=
```

랜덤값 생성:

```bash
openssl rand -hex 32
```

설명:

- `EAIS_WORKER_TOKEN`: 맥미니 eais-agent가 rex API를 호출할 때 쓰는 인증키
- `MCP_SHARED_TOKEN`: ChatGPT/MCP 호출을 임시로 보호하는 인증키
- `MCP_DEFAULT_ADMIN_ID`: MVP에서 ChatGPT 작업을 특정 관리자 ID로 기록하고 싶을 때 입력. 지금은 비워도 됨

## 2. eais-agent 환경변수 추가

파일:

```text
/Users/kbsc/eais-agent/.env.local
```

아래 값을 추가한다.

```env
REX_API_BASE=http://localhost:3002
REX_WORKER_TOKEN=rex의_EAIS_WORKER_TOKEN과_같은_값
WORKER_ID=eais-agent-macmini-1
POLL_INTERVAL_MS=30000
```

중요:

```text
rex:        EAIS_WORKER_TOKEN=AAA
eais-agent: REX_WORKER_TOKEN=AAA
```

두 값이 같아야 worker 인증이 통과한다.

## 3. rex 서버 실행

rex 프로젝트에서 실행:

```bash
cd /Users/kbsc/rex
npm run dev
```

기본 포트는 `3002`다.

## 4. 테스트 job 생성

관리자 쿠키 인증이 필요한 `/api/eais/jobs` 대신, 우선 MCP endpoint를 직접 테스트할 수 있다.

```bash
curl -sS http://localhost:3002/api/mcp \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer MCP_SHARED_TOKEN값' \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"create_address_job",
      "arguments":{
        "address":"구로구 오류동 156-144",
        "docType":"auto",
        "delivery":"drive"
      }
    }
  }'
```

응답에 `job.id`가 나오면 rex job 생성 성공.

## 5. eais-agent worker 1건 실행

eais-agent 프로젝트에서 실행:

```bash
cd /Users/kbsc/eais-agent
ONCE=1 npm run worker:rex
```

기대 흐름:

1. rex에서 pending job 1건 claim
2. 세움터 브라우저 실행
3. 주소 검색 및 건축물대장 발급
4. PDF 저장
5. HTML/신고서 PDF 생성
6. Google Drive 업로드
7. rex에 파일 링크 등록
8. job 상태 `done` 처리

## 6. 결과 확인

job ID가 있으면 MCP로 상태/결과를 확인한다.

```bash
curl -sS http://localhost:3002/api/mcp \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer MCP_SHARED_TOKEN값' \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"get_address_job_result",
      "arguments":{"jobId":"여기에_job_id"}
    }
  }'
```

## 아직 안 한 것

- 이메일 발송 기능
- ChatGPT 공식 커넥터/OAuth 연결
- 공개 서비스용 사용자별 권한/구독 체크
- 관리자 화면에서 EAIS job 목록 보기
- 실패 job 재시도 UI

## 테스트가 끝나면

이 파일은 삭제해도 된다.

```bash
rm /Users/kbsc/rex/docs/eais-mcp-next-steps.md
```
