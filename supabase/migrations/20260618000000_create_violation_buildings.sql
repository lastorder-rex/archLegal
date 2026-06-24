-- Migration: Create violation_buildings table
-- Created: 2026-06-18
-- Description: 위반건축물 지도용 데이터. VWorld WFS(viol_bd_yn=1)에서 수집한 건물을
--   좌표·용도·지번주소와 함께 저장한다. 지도는 화면 영역(bbox)으로 조회하므로
--   서울→전국 확장 시 구조 변경 없이 행만 추가하면 된다.

create extension if not exists "pgcrypto";

create table if not exists public.violation_buildings (
  id uuid primary key default gen_random_uuid(),
  pnu text not null unique,                 -- 19자리 필지고유번호
  sigungu_cd text not null,                 -- 시군구코드(5)
  bjdong_cd text not null,                  -- 법정동코드(5)
  sigungu_nm text,                          -- 시군구명 (예: 구로구)
  bjdong_nm text,                           -- 법정동명 (예: 오류동)
  bun integer,                              -- 본번
  ji integer,                               -- 부번
  jibun text,                               -- 지번주소 (예: 구로구 오류동 203-27)
  bld_nm text,                              -- 건물명
  use_code text,                            -- 용도 대분류 코드 (01000 등)
  use_name text,                            -- 용도명 (단독주택/공동주택/근린 등)
  residential boolean not null default false, -- 주거계열(단독·공동·근린) 여부
  floors integer,                           -- 지상 층수
  useapr_day text,                          -- 사용승인일 (YYYYMMDD)
  lat double precision not null,
  lon double precision not null,
  collected_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.violation_buildings is '위반건축물 지도용 데이터(VWorld viol_bd_yn=1 기준)';

-- 뷰포트(bbox) 조회용 + 행정구역 집계용 인덱스
create index if not exists idx_violation_buildings_bbox on public.violation_buildings (lat, lon);
create index if not exists idx_violation_buildings_lon on public.violation_buildings (lon);
create index if not exists idx_violation_buildings_sigungu on public.violation_buildings (sigungu_cd);
create index if not exists idx_violation_buildings_bjdong on public.violation_buildings (sigungu_cd, bjdong_cd);
create index if not exists idx_violation_buildings_residential on public.violation_buildings (residential);

-- 공개 읽기 전용 데이터(쓰기는 service role로만). 안전을 위해 RLS + public select 정책.
alter table public.violation_buildings enable row level security;

drop policy if exists "violation_buildings public read" on public.violation_buildings;
create policy "violation_buildings public read"
  on public.violation_buildings for select
  using (true);
