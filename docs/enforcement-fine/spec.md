# 이행강제금 예상 계산기 개발 정의서

작성일: 2026-06-09  
최근 업데이트: 2026-06-10  
서비스명: 이행강제금 예상 계산기  
관련 서비스: 양성화 1분 자가진단, 무료상담 신청

이 문서는 위반건축물 이행강제금 예상 계산 서비스를 개발하기 위한 기준 문서다. 계산 결과는 관할청의 최종 부과액이 아니라, 사용자가 입력한 정보와 공개 기준자료를 바탕으로 산출한 예상금액으로 제공한다.

## 1. 서비스 목적

- 위반건축물 보유자가 이행강제금 예상 규모를 빠르게 파악하도록 돕는다.
- 양성화 1분 자가진단 이후 상담 전환 흐름을 강화한다.
- 독립 메뉴에서도 로그인 후 이행강제금을 계산할 수 있게 한다.
- 상담 신청 시 계산 근거를 함께 저장해 관리자 상담 품질을 높인다.

## 2. 서비스 흐름

### 2.1 자가진단 연계 흐름

1. 사용자가 1분 자가진단을 완료한다.
2. 결과 화면에서 `예상 이행강제금 계산하기`를 클릭한다.
3. 비로그인 사용자는 로그인한다.
4. 계산기 화면으로 이동한다.
5. 주소를 입력한다.
6. 집합건축물인 경우 전유부 목록에서 동/호수를 선택한다.
7. 위반면적, 위반유형, 위반 부분 공사완료시기를 입력한다.
8. 예상 이행강제금과 산출근거를 확인한다.
9. 무료상담 신청으로 연결한다.

### 2.2 독립 계산 흐름

1. 홈페이지 메뉴에서 `이행강제금 계산기`를 클릭한다.
2. 비로그인 사용자는 로그인한다.
3. 주소를 입력한다.
4. 집합건축물인 경우 전유부 목록에서 동/호수를 선택한다.
5. 위반정보를 입력한다.
6. 예상 이행강제금을 확인한다.
7. 무료상담 신청으로 연결한다.

## 3. 로그인 정책

- 계산기 사용은 로그인 필수로 한다.
- 비로그인 접근 시 로그인 팝업 또는 로그인 페이지로 이동한다.
- 로그인 완료 후 원래 접근하려던 계산기 경로로 복귀한다.
- 계산 결과와 상담 신청은 로그인 사용자 기준으로 연결한다.

## 4. 사용자 입력 정책

사용자 입력은 최소화한다. 기본값은 API와 기준자료 DB로 자동 추정하고, 사용자가 모르는 항목은 `잘 모르겠음`을 선택할 수 있게 한다.

### 4.1 필수 입력

| 항목 | 입력 방식 | 설명 |
| --- | --- | --- |
| 주소 | 주소검색 | 도로명 또는 지번주소 |
| 동/호수 | 목록 선택 | 집합건축물인 경우 전유부 API 결과에서 선택. 단독/다가구 등 비집합건축물은 생략 |
| 위반면적 | 평 또는 ㎡ | 평 입력 시 ㎡로 자동 변환 |
| 위반유형 | 선택 | 무허가 증축, 무신고 증축, 용도변경, 대수선, 잘 모르겠음 |
| 위반 부분 공사완료시기 | 선택/직접입력 | 1년 이내, 3년 이내, 5년 이내, 10년 이내, 직접입력, 잘 모르겠음 |

### 4.2 자동 추정 후 사용자 확인

| 항목 | 기본값 | 사용자 조정 |
| --- | --- | --- |
| 위반 부분 구조 | 건축물대장 구조 | 기존 건물과 같음, 다른 구조 선택, 잘 모르겠음 |
| 위반 부분 용도 | 건축물대장 용도 | 기존 용도와 같음, 다른 용도 선택, 잘 모르겠음 |
| 해당 세대 전유면적 | 전유공용면적 API | 집합건축물의 85㎡ 이하 여부 판단 보조 |
| 해당 세대 층수 | 전유부 또는 전유공용면적 API | 상가 가산, 층별 특례 검토 보조 |
| 위치지수 | VWorld 개별공시지가로 자동 매핑 | 수정 불가 또는 관리자 기준 |
| 잔가율 | 위반 부분 공사완료시기 기준 | 공사완료시기 수정 |

### 4.3 선택 입력

결과 화면 또는 고급설정 영역에서 선택적으로 입력받는다.

| 항목 | 목적 |
| --- | --- |
| 위반 후 소유권 변경 여부 | 이행강제금 감경 가능성 판단 |
| 해당 세대 또는 1구 면적 85㎡ 이하 여부 | 주거용 소규모 감경 가능성 판단 |
| 임대 등 영리 목적 사용 여부 | 가중 가능성 판단 |
| 이미 이행강제금 부과를 받은 적이 있는지 | 반복 부과, 특별조치법 과태료 상담 참고 |

## 5. 자동 조회 항목

### 5.1 주소검색 API

주소 입력 후 아래 값을 확보한다.

- 도로명주소
- 지번주소
- 시군구코드
- 법정동코드
- 대지구분코드
- 번
- 지

### 5.2 건축물대장 표제부 API

공공데이터포털 건축HUB 표제부 API를 사용한다.

- Base URL: `https://apis.data.go.kr/1613000/BldRgstHubService`
- Endpoint: `/getBrTitleInfo`
- 응답 포맷: `_type=json`

확보 항목:

- 주용도
- 세부용도
- 구조
- 사용승인일
- 연면적
- 대지면적
- 층수
- 세대수
- 건축물대장 관리번호

주의:

- 건축물대장 표제부 API는 위반건축물 표기 여부를 제공하지 않는다.
- 집합건축물의 세대별 면적 판단이 필요하면 전유부 API 또는 사용자 입력이 필요하다.

### 5.3 건축물대장 전유부 API

집합건축물은 주소만으로 특정 세대의 전유면적과 층수를 확정하기 어렵다. 주소 조회 후 전유부 목록을 조회하고, 사용자가 동/호수를 선택하게 한다.

전유부 목록:

- Base URL: `https://apis.data.go.kr/1613000/BldRgstHubService`
- Endpoint: `/getBrExposInfo`
- 응답 포맷: `_type=json`

확보 항목:

- 동명
- 호명
- 층 구분
- 층수
- 전유부 건축물대장 관리번호

전유공용면적:

- Base URL: `https://apis.data.go.kr/1613000/BldRgstHubService`
- Endpoint: `/getBrExposPubuseAreaInfo`
- 응답 포맷: `_type=json`

확보 항목:

- 전유/공용 구분
- 전유면적
- 공용면적
- 해당 호실의 구조
- 해당 호실의 주용도/세부용도
- 해당 호실의 층수

적용 정책:

- 전유부 목록 조회 결과가 있으면 사용자가 동/호수를 선택한다.
- 선택한 동/호수 기준으로 `getBrExposPubuseAreaInfo` 결과를 필터링한다.
- 전유면적은 소규모 주거 감경 가능성 판단 보조값으로 사용한다.
- 구조와 용도는 표제부보다 전유공용면적 API의 해당 호실 값을 우선한다.
- 위반면적은 전유면적과 별개로 사용자 입력을 받는다.
- 전유부 API에서도 위반건축물 표기 여부는 확인하지 못하므로, 위반 여부는 사용자 진술 또는 상담 단계 확인으로 둔다.

검증 예시:

```text
주소: 서울특별시 금천구 독산로18길 14
건물명: 늘해랑
선택 호실: B동 601호
전유면적: 49.94㎡
공용면적: 10.04㎡
층수: 지상 6층
구조: 철근콘크리트구조
용도: 다세대주택
세부용도: 도시형생활주택/단지형다세대주택
```

### 5.4 VWorld 개별공시지가 API

서버 API route에서 `VWORLD_API_KEY` 환경변수를 사용한다. 클라이언트에 키를 노출하지 않는다.

확보 항목:

- PNU
- 기준연도
- 개별공시지가
- 공시일자
- 최종수정일

동일 PNU와 기준연도에 여러 행이 내려오면 `lastUpdtDt`가 가장 최신인 행을 사용한다.

## 6. 기준자료 DB

MD 파일은 검토/문서용으로 보관하고, 실제 계산에는 DB 테이블을 사용한다.

초기 스키마 마이그레이션:

```text
supabase/migrations/033_create_enforcement_fine_tables.sql
```

초기 기준자료 seed 마이그레이션:

```text
supabase/migrations/034_seed_enforcement_fine_reference_data.sql
```

가산/감산율 seed 마이그레이션:

```text
supabase/migrations/035_seed_standard_price_adjustment_rates.sql
```

위반유형별 산식/요율 seed 마이그레이션:

```text
supabase/migrations/036_create_enforcement_fine_violation_rates.sql
```

증축·개축 및 대수선 시가표준액 산정비율 seed 마이그레이션:

```text
supabase/migrations/037_create_standard_price_special_ratios.sql
```

MVP seed는 주거용 계산에 필요한 기준자료와 주요 가산/감산율을 우선 반영한다. 전체 용도지수와 특수 케이스 전체 자동 적용은 후속 import 범위로 둔다.

### 6.1 구조지수

테이블 예:

```text
standard_price_structure_indices
- id
- year
- structure_name
- structure_index
- useful_life_years
- source
- created_at
```

별도 alias 테이블:

```text
standard_price_structure_aliases
- id
- structure_index_id
- alias_name
```

예:

```text
건축물대장: 철근콘크리트구조
기준표: 철근콘크리트조
구조지수: 1.00
내용연수: 40년
```

### 6.2 용도지수

테이블 예:

```text
standard_price_use_indices
- id
- year
- category
- main_use
- use_no
- detail_use
- use_index
- source
- created_at
```

별도 alias 테이블:

```text
standard_price_use_aliases
- id
- use_index_id
- api_main_use
- api_detail_use_pattern
```

예:

```text
건축물대장: 공동주택 / 공동주택(다세대주택-8세대)
기준표: 공동주택 : 연립주택, 다세대주택
용도지수: 0.91
```

### 6.3 위치지수

테이블 예:

```text
standard_price_location_indices
- id
- year
- min_land_price_krw_per_m2
- max_land_price_krw_per_m2
- location_index
- source
- created_at
```

위치지수 표의 단위가 천원/㎡이면 DB에는 원/㎡로 변환 저장한다.

예:

```text
개별공시지가: 3,064,000원/㎡
표 단위 변환: 3,064천원/㎡
구간: 3,000 초과 ~ 4,000 이하
위치지수: 1.18
```

### 6.4 잔가율

테이블 예:

```text
standard_price_depreciation_rates
- id
- year
- useful_life_years
- construction_year
- depreciation_rate
- source
- created_at
```

주의:

- 기존 건물 사용승인일이 아니라 위반 부분 공사완료시기를 우선 적용한다.
- 사용자가 모르면 예상 범위로 계산한다.

### 6.5 가산율/감산율

가산율/감산율은 계산 정확도에 직접 영향을 주므로 MVP부터 기준자료 DB에 반영한다. 다만 모든 항목을 무조건 자동 적용하지 않고, 판정 신뢰도에 따라 `자동 적용`, `자동 후보 + 사용자 확인`, `MVP 보류`로 구분한다.

테이블 예:

```text
standard_price_adjustment_rates
- id
- year
- adjustment_type increase | decrease
- code
- label
- rate
- apply_strategy auto | candidate | manual | deferred
- applies_to
- excluded_cases
- condition_summary
- user_question
- auto_apply
- sort_order
- source
- source_detail
- created_at
```

적용 방식:

```text
최종 가감산계수 = 1 + 적용 가산율 합계 - 적용 감산율 합계
```

공통 원칙:

- 가산대상과 감산대상에 둘 이상 해당하면 각각의 가산율 또는 감산율을 더해 중복 적용한다.
- API 값으로 명확히 판정되는 항목은 자동 적용한다.
- 실제 위반 부분이 API로 조회한 전유부/표제부와 다른 경우가 있으므로, 불명확한 항목은 짧은 확인 질문으로 처리한다.
- 적용 제외 조건이 있는 항목은 제외 조건을 먼저 검사한다.

자동 적용 가능성이 높은 항목:

| 항목 | 적용 조건 | 필요 데이터 |
| --- | --- | --- |
| 단독주택 1구 연면적 60㎡ 초과 85㎡ 이하 감산 | 다가구가 아닌 단독주택이고 1구 연면적이 해당 구간 | 표제부 용도, 연면적 |
| 단독주택 1구 연면적 60㎡ 이하 감산 | 다가구가 아닌 단독주택이고 1구 연면적이 해당 구간 | 표제부 용도, 연면적 |
| 1층 상가부분 가산 | 위반 부분 용도가 상가 계열이고 지상 1층이며 전체 층수 구간 확인 | 전유부/층수/용도지수 |
| 2층 상가부분 가산 | 위반 부분 용도가 상가 계열이고 지상 2층이며 전체 층수 구간 확인 | 전유부/층수/용도지수 |
| 지하층 상가부분 감산 | 위반 부분 용도가 상가 계열이고 지하층 | 전유부/층수/용도지수 |
| 5층 이상 상가부분 감산 | 위반 부분 용도가 상가 계열이고 지상 5층 이상 | 전유부/층수/용도지수 |
| 주차장 감산 | 건축물대장상 주차장이고 지하층이 아닌 2층 이상 | 전유부/표제부 용도, 층수 |

### 6.6 증축·개축 및 대수선 산정비율

실제 사례 검토 결과, 단순히 본건물의 구조/용도/잔가율로 `1㎡당 시가표준액 × 위반면적`을 계산하면 부과액과 큰 차이가 발생한다. 특히 다음 항목은 기준자료 DB로 분리해 계산에 반영한다.

증축·개축 산정비율:

```text
standard_price_extension_ratios
- id
- year
- structure_no
- construction_type with_foundation | without_foundation | without_foundation_multilevel
- label
- ratio
- source
- source_detail
```

대수선 산정비율:

```text
standard_price_major_repair_ratios
- id
- year
- structure_no
- approval_type permit | report
- label
- ratio
- roof_repair_reduction_rate
- source
- source_detail
```

적용 원칙:

- 증축/개축은 `㎡당 신축건축물 시가표준액 × 산정비율 × 위반면적 × 가감산율`을 위반부분 시가표준액으로 본다.
- 증축/개축의 잔가율 기준연도는 기존 건물 사용승인일이 아니라 위반부분 공사완료연도를 우선 사용한다.
- 위반부분 구조가 본건물 구조와 다를 수 있으므로 사용자가 위반부분 구조를 확인하거나 선택할 수 있어야 한다.
- 대수선은 대수선 허가/신고 구분과 구조번호별 산정비율을 반영한다.
- 대수선은 변경된 경과연수별 잔가율 방식도 존재하므로, 산정비율 방식과 변경 잔가율 방식을 구분해 산출근거에 남긴다.
- 노후 건축물 지붕 수선 또는 덮개 추가는 대수선 산정비율의 30% 경감 후보로 둔다.
- 소규모 주택 감경, 소유권 변경 감경, 조례 감경은 이행강제금 단계의 별도 감경으로 산출근거에 분리한다.
| 고층/초고층 가산 | 전체 층수 기준으로 고층/초고층 요건 충족 | 표제부 층수 |

자동 후보 + 사용자 확인 항목:

| 항목 | 확인 질문 |
| --- | --- |
| 특수설비 | 건물에 인텔리전트 빌딩시스템 등 특수설비가 설치되어 있나요? |
| 층고 가산 | 위반 부분 층 높이가 8m 이상이거나 다른 층보다 2배 이상 높은가요? |
| 주택의 차고 감산 | 위반 부분이 주택의 차고로 사용되는 공간인가요? |
| 무벽감산 | 위반 부분에 벽이 없는 면적이 있나요? |
| 철골조 벽면 감산 | 철골조 건축물의 벽면이 조립식패널, 칼라강판, 시멘트블록, 슬레이트벽인가요? |
| 컨테이너 가설건축물 감산 | 위반 부분이 연면적 30㎡ 이하 컨테이너 구조 가설건축물인가요? |

MVP 계산 결과에는 적용된 가산/감산 항목과 적용하지 않은 후보 항목을 함께 표시한다.

## 7. 계산식

### 7.1 시가표준액 산정

오피스텔 외 건축물 기본 산식:

```text
1㎡당 시가표준액
= 건물신축가격기준액
× 구조지수
× 용도지수
× 위치지수
× 경과연수별 잔가율
× 가감산율
```

업무요령 기준으로 `1㎡당 금액`에서 1,000원 미만은 버린다. 단, 1㎡당 금액이 1,000원 미만이면 1,000원으로 한다.

```text
건축물 시가표준액
= 1㎡당 시가표준액 × 위반면적
```

### 7.2 이행강제금 기본 산식

위반유형은 크게 두 산식으로 분리한다. 신축/증축 위반은 「건축법」 제80조제1항제1호 계열로 계산하고, 대수선/용도변경/사용승인 없이 사용/기타 위반은 「건축법」 제80조제1항제2호 및 「건축법 시행령」 별표 15 계열로 계산한다.

#### 7.2.1 신축/증축 위반

```text
예상 이행강제금
= 위반면적
× 1㎡당 시가표준액
× 50%
× 위반내용 비율
```

위반내용 비율:

| 위반유형 | 적용 비율 | 비고 |
| --- | ---: | --- |
| 무허가 건축/증축 | 100% | 허가 대상 위반 가정 |
| 무신고 건축/증축 | 70% | 신고 대상 위반 가정 |
| 건폐율 초과 | 80% | 위반유형 확인 필요 |
| 용적률 초과 | 90% | 위반유형 확인 필요 |
| 잘 모르겠음 | 범위 계산 | 무신고~무허가 범위 등 |

#### 7.2.2 대수선/용도변경 등 그 밖의 위반

```text
예상 이행강제금
= 위반부분 시가표준액
× 위반유형 비율
```

위반부분 시가표준액은 기본적으로 다음처럼 산정한다.

```text
위반부분 시가표준액
= 1㎡당 시가표준액 × 위반면적
```

다만 대수선은 시가표준액 산정 단계에서 별도 대수선 산출비율을 적용해야 하는 경우가 있으므로, MVP에서는 `대수선 일반 추정`으로 계산하고 산출근거에 주의문구를 표시한다.

위반유형 비율:

| 위반유형 | 적용 비율 | 비고 |
| --- | ---: | --- |
| 무단 대수선 | 10% | 허가/신고 없이 대수선한 경우 |
| 무단 용도변경 | 10% | 용도변경한 부분 기준 |
| 사용승인 없이 사용 | 2% | 사용승인을 받지 않고 사용 중인 경우 |
| 조경/건축선/구조/피난/방화/높이/일조 등 | 10% | 세부 위반내용 확인 필요 |
| 그 밖의 위반 | 3% 이하 | 조례에 별도 규정이 없으면 3% 기준 |

### 7.3 감경/가중 적용

감경/가중은 기본 계산 후 별도 단계로 적용한다.

검토 항목:

- 주거용 소규모 건축물 감경
- 위반행위 후 소유권 변경
- 임차인 존재 등 즉시 시정 곤란
- 1992년 6월 1일 이전 위반 주거용 건축물 감경
- 임대 등 영리 목적 가중
- 상습 위반 가중
- 관할 지자체 조례상 감경/가중

주의:

- 감경 사유는 중복 적용 제한이 있을 수 있다.
- 대수선 등 제80조제1항제2호 계열 위반의 주거용 감경은 조례와 위반유형별 적용대상 확인이 필요하므로 자동 확정하지 않는다.
- MVP에서는 감경/가중을 자동 확정하지 않고, “감경 가능성 있음/가중 가능성 있음”으로 표시한다.
- 관할 조례가 확인된 경우에만 계산값에 반영한다.

## 8. 결과 화면

### 8.1 기본 표시

```text
예상 이행강제금
약 000만 원
```

보조 문구:

```text
입력값과 공개 기준자료를 바탕으로 산출한 예상금액입니다.
실제 부과액은 관할청 현장 확인, 위반 내용, 조례, 감경·가중 여부에 따라 달라질 수 있습니다.
```

### 8.2 산출근거

접기/펼치기 영역으로 제공한다.

- 위반면적
- 위반유형
- 건물신축가격기준액
- 구조지수
- 용도지수
- 위치지수
- 잔가율
- 1㎡당 시가표준액
- 건축물 시가표준액
- 기본 부과요율
- 위반유형 비율
- 적용하지 않은 주의 항목

### 8.3 CTA

- 무료상담 신청하기
- 다시 계산하기
- 1분 자가진단으로 돌아가기

## 9. API 및 화면 설계

### 9.1 API 설계

주소 조회, 건축물대장 조회, 기준자료 매핑은 서버에서 처리한다. 외부 API 키는 클라이언트에 노출하지 않는다.

#### `POST /api/enforcement-fine/prepare`

목적:

- 주소와 선택 동/호 기준으로 자동 계산 후보값을 준비한다.
- 집합건축물인 경우 전유부 목록 또는 선택 호실의 상세값을 반환한다.

요청 예:

```json
{
  "address": "서울특별시 금천구 독산로18길 14",
  "dongName": "B동",
  "hoName": "601"
}
```

응답 예:

```json
{
  "address": {
    "roadAddress": "서울특별시 금천구 독산로18길 14",
    "jibunAddress": "서울특별시 금천구 시흥동 833-3",
    "pnu": "1154510300108330003",
    "sigunguCd": "11545",
    "bjdongCd": "10300",
    "platGbCd": "0",
    "bun": "0833",
    "ji": "0003"
  },
  "building": {
    "mainUse": "공동주택",
    "detailUse": "다세대주택",
    "structure": "철근콘크리트구조",
    "useApprovalDate": "2016-03-16",
    "groundFloorCount": 6,
    "totalAreaM2": 659.2
  },
  "unit": {
    "dongName": "B동",
    "hoName": "601",
    "floorName": "6층",
    "exclusiveAreaM2": 49.94,
    "publicAreaM2": 10.04,
    "mainUse": "다세대주택",
    "detailUse": "도시형생활주택/단지형다세대주택",
    "structure": "철근콘크리트구조"
  },
  "reference": {
    "landPriceKrwPerM2": 3412000,
    "locationIndex": 1.18,
    "structureIndex": 1.0,
    "useIndex": 0.91,
    "usefulLifeYears": 40
  },
    "adjustmentCandidates": []
}
```

#### `GET /api/enforcement-fine/violation-types`

목적:

- DB 기준표 `enforcement_fine_violation_rates`에서 화면에 노출할 위반유형 목록을 조회한다.
- 화면에서 위반유형과 요율을 하드코딩하지 않는다.

응답 예:

```json
{
  "year": 2026,
  "items": [
    {
      "code": "unauthorized_extension",
      "label": "허가 없이 신축/증축",
      "formulaType": "extension_area",
      "baseFineRate": 0.5,
      "violationRate": 1,
      "requiresLocalOrdinance": true,
      "requiresUserConfirmation": false
    },
    {
      "code": "unauthorized_major_repair",
      "label": "무단 대수선",
      "formulaType": "standard_value",
      "baseFineRate": null,
      "violationRate": 0.1,
      "requiresLocalOrdinance": true,
      "requiresUserConfirmation": true
    }
  ]
}
```

#### `POST /api/enforcement-fine/calculate`

목적:

- 사용자가 입력한 위반정보와 `prepare` 결과를 기준으로 예상 이행강제금을 계산한다.
- 적용된 가산/감산, 적용하지 않은 후보, 사용자 확인 답변을 산출근거에 포함한다.
- 계산 결과를 `enforcement_fine_estimates`에 저장하고 `estimateId`를 반환한다.

요청 예:

```json
{
  "preparedData": {
    "address": {},
    "building": {},
    "reference": {},
    "adjustmentCandidates": {}
  },
  "violationAreaM2": 12,
  "violationType": "unauthorized_extension",
  "violationCompletedYear": 2016,
  "selectedAdjustmentCodes": [],
  "excludedAppliedAdjustmentCodes": []
}
```

응답 예:

```json
{
  "estimateId": "uuid",
  "result": {
    "estimatedFineKrw": 4290000,
    "estimatedFineMinKrw": 4290000,
    "estimatedFineMaxKrw": 4290000,
    "standardPriceKrwPerM2": 715000,
    "buildingStandardValueKrw": 8580000,
    "formulaType": "extension_area",
    "violationLabel": "허가 없이 신축/증축",
    "warnings": [
      "실제 부과액은 관할청 판단과 조례에 따라 달라질 수 있습니다."
    ]
  },
  "calculationBasis": {},
  "savedEstimate": {}
}
```

### 9.2 화면 설계

1. 주소 입력
2. 집합건축물인 경우 동/호 선택
3. 자동 조회 결과 확인
4. 위반면적 입력
5. 위반유형 선택
6. 위반 부분 공사완료시기 선택 또는 직접입력
7. 자동 후보 질문 확인
8. 예상금액과 산출근거 확인
9. 무료상담 신청

UI 원칙:

- 사용자가 처음부터 가산/감산표를 직접 고르게 하지 않는다.
- 자동 판정된 항목은 결과 화면 산출근거에 표시한다.
- 불명확한 후보만 짧은 예/아니오 질문으로 노출한다.
- 사용자가 `잘 모르겠음`을 선택하면 해당 항목은 계산에 반영하지 않고 주의사항에 표시한다.
- 모바일에서는 한 화면에 한 의사결정만 배치한다.

## 10. 계산 결과 저장

MVP에서는 계산 결과를 상담 신청과 연결해 저장한다. 별도 결과 다시보기는 2차 개발로 둔다.

저장 후보:

```text
enforcement_fine_estimates
- id
- user_id
- consultation_id nullable
- address
- road_address
- jibun_address
- pnu
- sigungu_cd
- bjdong_cd
- bun
- ji
- violation_area_m2
- violation_area_pyeong
- violation_type
- violation_rate_id
- formula_type
- calculation_version
- violation_completed_year
- structure_name
- structure_index
- useful_life_years
- use_name
- use_index
- violation_structure_index_id
- violation_use_index_id
- violation_structure_no
- violation_structure_name
- violation_structure_index
- violation_use_name
- violation_use_index
- extension_ratio_id
- extension_construction_type
- extension_standard_value_ratio
- major_repair_ratio_id
- major_repair_approval_type
- major_repair_standard_value_ratio
- major_repair_changed_construction_year
- major_repair_roof_reduction_applied
- small_residential_reduction_applied
- small_residential_reduction_rate
- land_price_krw_per_m2
- location_index
- depreciation_rate
- base_price_krw_per_m2
- standard_price_krw_per_m2
- building_standard_value_krw
- base_fine_rate
- violation_rate
- estimated_fine_krw
- reduction_flags jsonb
- increase_flags jsonb
- calculation_basis jsonb
- created_at
```

## 11. MVP 범위

### 11.1 포함

- 로그인 필수 계산기 페이지
- 주소검색
- 건축물대장 표제부 조회
- 집합건축물 전유부 목록 조회
- 동/호 선택 후 전유공용면적 조회
- VWorld 개별공시지가 조회
- 구조지수, 용도지수, 위치지수, 잔가율 DB 매핑
- 위반부분 구조 선택 및 별도 구조지수 적용
- 증축·개축 산정비율 적용
- 대수선 산정비율 적용
- 무허가/무신고 증축 기본 계산
- 무단 대수선 기본 계산
- 위반유형을 모르는 경우 범위 계산
- 계산 결과 화면
- 산출근거 표시
- 무료상담 신청 연결
- 상담 신청 시 계산 결과 저장
- 1분 자가진단 결과 화면에서 계산기 CTA 연결

### 11.2 보류

- 모바일 앱 출시
- OCR로 건축물대장 PDF 위반표기 자동 판독
- 자동 표제부 발급
- 모든 지자체 조례 자동 반영
- 가산율/감산율 전 항목 자동 판정
- 대수선/용도변경 정밀 계산
- 계산 결과 공유 링크
- 계산 결과 다시보기

## 12. 주요 리스크

- 위반건축물 여부는 현재 건축물대장 API에서 자동 확인되지 않는다.
- 위반 부분의 실제 구조와 용도가 기존 건물과 다를 수 있다.
- 위반 부분 공사완료시기는 사용자 입력에 의존한다.
- 집합건축물은 표제부만으로 세대별 85㎡ 이하 여부를 판단하기 어렵다.
- 집합건축물은 동/호수 선택 전까지 전유면적, 층수, 해당 호실 용도를 확정하기 어렵다.
- 감경/가중은 조례와 관할청 판단이 개입될 수 있다.
- 서울 외 지역으로 확장하려면 지자체별 기준자료와 조례 DB가 필요하다.

## 13. 참고 출처

- `docs/legalization-1min-diagnosis-spec.md`
- `docs/enforcement-fine/structure-index.md`
- `docs/enforcement-fine/use-index.md`
- `docs/enforcement-fine/location-index.md`
- `docs/enforcement-fine/depreciation-rate.md`
- `docs/enforcement-fine/depreciation-rate-by-year.md`
- `docs/enforcement-fine/2026-standard-price-guide-1-75.md`
- 찾기쉬운 생활법령정보, 건축법 등 위반건축물: https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=1406
- 국가법령정보센터, 건축법: https://www.law.go.kr
- 국가법령정보센터, 건축법 시행령: https://www.law.go.kr
