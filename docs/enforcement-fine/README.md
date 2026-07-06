# 이행강제금 예상 계산기 문서

이 폴더는 이행강제금 예상 계산기 개발과 기준자료 DB화를 위한 문서를 보관한다.

## 문서 목록

- `spec.md`: 서비스 개발 정의서
- `structure-index.md`: 구조지수 기준표
- `use-index.md`: 용도지수 기준표
- `location-index.md`: 위치지수 기준표
- `depreciation-rate.md`: 구조별 내용연수 및 잔가율 기준
- `depreciation-rate-by-year.md`: 신축연도별 잔가율 기준
- `2026-standard-price-guide-1-75.md`: 2026년도 지방세 시가표준액 조사·산정 업무요령 1~75페이지
- `2026-standard-price-guide-part2-1-24.md`: 2026년도 지방세 시가표준액 조사·산정 업무요령 중 증·개축/대수선 산정 기준
- `verification-cases.md`: 실제 부과 사례와 계산기 결과 비교 검증표
- `이행강제금_산정_가이드라인.md`: 알기쉬운 이행강제금 산정 가이드라인(용인특례시, 2026.4) 정리본

## DB 마이그레이션

- `supabase/migrations/033_create_enforcement_fine_tables.sql`: 계산기 기준자료/결과 저장 테이블
- `supabase/migrations/034_seed_enforcement_fine_reference_data.sql`: 2026 기준가격, 구조지수, 용도지수, 위치지수, 잔가율 seed
- `supabase/migrations/035_seed_standard_price_adjustment_rates.sql`: 2026 가산/감산율 seed 및 적용전략 메타데이터
- `supabase/migrations/036_create_enforcement_fine_violation_rates.sql`: 위반유형별 기본 산식/요율 seed
- `supabase/migrations/037_create_standard_price_special_ratios.sql`: 증축·개축 및 대수선 시가표준액 산정비율 seed
- `supabase/migrations/038_create_enforcement_fine_special_condition_rates.sql`: 위반 후 취득/영리 목적/반복 위반 감경·가중 후보 요율 seed
- `supabase/migrations/039_seed_enforcement_fine_reduction_candidates.sql`: 자동 감경 후보 seed
- `supabase/migrations/040_seed_full_standard_price_use_indices.sql`: 2026 용도지수 전체 seed
- `supabase/migrations/041_seed_structure_index_aliases.sql`: 구조지수 누락 항목 및 alias seed
- `supabase/migrations/042_seed_detailed_violation_rates.sql`: 세부 위반유형 seed
- `supabase/migrations/043_correct_special_condition_increase_rates.sql`: 가중부과 배율 보정
- `supabase/migrations/044_seed_additional_reduction_special_conditions.sql`: 추가 감경·특례 후보 seed

원본 PDF/엑셀은 용량과 저작권/관리 방식을 확인한 뒤 별도 보관 위치를 정한다. 서비스 계산에는 이 문서들을 직접 읽지 않고, DB로 import한 기준자료를 사용한다.
