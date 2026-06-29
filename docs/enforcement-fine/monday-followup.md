# 월요일 후속 작업 메모 - 이행강제금 계산기 위반유형 UI

작성일: 2026-06-12

## 현재 상태

- 로컬 소스에는 계산기 위반유형 UI를 실무형 3개 그룹으로 바꾸는 변경이 들어가 있다.
- TypeScript 검사는 통과했다: `npx tsc --noEmit`
- 로컬 dev 서버는 내려둔 상태다.
- 운영 Supabase에는 사용자가 최소 SQL을 적용했거나 적용 예정인 상태로 보면 된다. 월요일에 실제 DB 상태를 먼저 확인한다.

## 목표 UI

위반유형 선택지는 아래 구조로 보여준다.

```text
1. 무허가/무신고 증축
   - 허가 없이 증축
   - 신고 없이 증축
   - 건폐율 초과
   - 용적률 초과

2. 무단 용도변경
   - 근린생활시설 등 비주거 용도를 주거로 사용
   - 주택을 다른 용도로 사용

3. 기타 위반
   - 대수선
   - 조경
   - 건축선
   - 피난/방화
   - 건축설비
   - 잘 모르겠음
```

## 구현 방식

- 프론트 표시값은 실무형 라벨을 쓴다.
- 계산 요청에는 기존 DB `code`를 그대로 보낸다.
- `주택을 다른 용도로 사용`은 화면상 별도 항목이지만 계산에는 `unauthorized_use_change`로 매핑한다.
- `잘 모르겠음`은 `other_violation_max_3`로 매핑한다.
- 계산 로직 자체는 수정하지 않았다.

## 관련 파일

- `components/enforcement-fine/EnforcementFineCalculatorClient.tsx`
  - 위반유형 그룹/라벨/매핑 변경
  - 결과 카드와 상담 전환 메시지에도 화면 라벨이 유지되도록 변경
- `supabase/migrations/036_create_enforcement_fine_violation_rates.sql`
  - `coverage_ratio_excess`, `floor_area_ratio_excess` 선택 가능하도록 seed 수정
- `supabase/migrations/042_seed_detailed_violation_rates.sql`
  - `other_violation_max_3`가 숨겨지지 않도록 수정
  - `일조권 높이 제한 위반` 라벨을 `일조사선 위반`으로 변경
- `supabase/migrations/044_seed_additional_reduction_special_conditions.sql`
  - 특례 라벨을 `일조사선 위반 주거용`으로 변경

## 월요일에 먼저 확인할 것

1. 운영 Supabase DB 상태 확인
   - 아래 코드들이 `user_selectable = true`인지 확인한다.

```sql
select code, label, user_selectable, violation_rate, formula_type
from public.enforcement_fine_violation_rates
where year = 2026
  and code in (
    'unauthorized_extension',
    'unreported_extension',
    'coverage_ratio_excess',
    'floor_area_ratio_excess',
    'unauthorized_use_change',
    'unauthorized_major_repair',
    'landscape_violation',
    'building_line_violation',
    'evacuation_fire_compartment_violation',
    'building_equipment_violation',
    'other_violation_max_3'
  )
order by sort_order;
```

2. 최소 SQL이 아직 적용되지 않았다면 적용한다.

```sql
update public.enforcement_fine_violation_rates
set user_selectable = true, updated_at = now()
where year = 2026
  and code in ('coverage_ratio_excess', 'floor_area_ratio_excess', 'other_violation_max_3');

update public.enforcement_fine_violation_rates
set label = '일조사선 위반', updated_at = now()
where year = 2026
  and code = 'sunlight_height_violation';

update public.enforcement_fine_special_condition_rates
set label = '일조사선 위반 주거용', updated_at = now()
where year = 2026
  and code = 'article80_sunlight_residential_half';
```

3. 로컬에서 확인

```bash
npm run dev
npx tsc --noEmit
```

4. 계산기 화면 확인

- `/calc`에서 위반유형 select가 목표 UI처럼 3개 그룹으로 보이는지 확인한다.
- `근린생활시설 등 비주거 용도를 주거로 사용` 선택 후 용도변경용 입력이 정상 노출되는지 확인한다.
- `주택을 다른 용도로 사용` 선택 후에도 같은 용도변경 계산 로직으로 동작하는지 확인한다.
- `잘 모르겠음` 선택 시 계산이 에러 없이 진행되고, 기타/범위성 경고가 표시되는지 확인한다.

## 배포 전 주의

- 운영 DB에서 기존 항목을 숨기는 전체 SQL은 프론트 배포와 같이 진행할 때만 검토한다.
- 현재 프론트는 목표 UI에 포함된 항목만 보여주므로, DB에 다른 `user_selectable = true` 항목이 있어도 화면에는 노출하지 않는다.
- 배포 전 `git diff`에서 unrelated 변경을 같이 올리지 않도록 확인한다.

## 현재 작업트리 주의

이 작업 외에 이미 수정/추가되어 있던 파일들이 있었다.

- `.vscode/settings.json`
- `lib/enforcement-fine/prepare.ts`
- `.claude/`
- `.codex/`
- `AGENTS.md`
- `app/api/land-price/`
- `lib/services/land-price.ts`

이번 위반유형 UI 작업으로 묶을 파일은 아래만 보면 된다.

- `components/enforcement-fine/EnforcementFineCalculatorClient.tsx`
- `supabase/migrations/036_create_enforcement_fine_violation_rates.sql`
- `supabase/migrations/042_seed_detailed_violation_rates.sql`
- `supabase/migrations/044_seed_additional_reduction_special_conditions.sql`
- `docs/enforcement-fine/monday-followup.md`
