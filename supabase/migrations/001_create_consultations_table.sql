-- Migration: Create consultations table for consultation board registration
-- Created: 2025-09-28
-- Description: Consultation board with Kakao auth integration, address search, and building registry data

-- Enable required extensions
create extension if not exists "pgcrypto";

-- Create consultations table
create table if not exists consultations (
  -- Primary identification
  id uuid primary key default gen_random_uuid(),

  -- User information (from Kakao auth)
  user_id text not null,           -- Kakao user ID from auth.uid()
  nickname text,                   -- Auto-filled from Kakao user_metadata
  name text not null,              -- User's real name (required)
  phone text not null,             -- Korean phone format (010-XXXX-XXXX)
  email text,                      -- Optional email from Kakao or manual input

  -- Address information
  address text not null,           -- Full address string for display
  address_code jsonb not null,     -- Structured data from Juso API

  -- Building information from 건축물대장 API
  building_info jsonb not null,    -- Full building registry API response
  main_purps text,                 -- Parsed: main purpose code name (주용도)
  tot_area numeric,                -- Parsed: total floor area (연면적)
  plat_area numeric,               -- Parsed: plot area (대지면적)
  ground_floor_cnt integer,        -- Parsed: ground floor count (지상층수)

  -- Consultation details
  message text check (length(message) <= 1000), -- Max 1000 characters

  -- Metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add comments for documentation
comment on table consultations is 'Consultation requests with Kakao authentication and building data';
comment on column consultations.user_id is 'Kakao user ID from Supabase auth.uid()';
comment on column consultations.address_code is 'JSONB data from Juso API (도로명주소)';
comment on column consultations.building_info is 'JSONB data from 건축물대장 API';
comment on column consultations.message is 'User consultation message (max 1000 chars)';

-- Enable Row Level Security
alter table consultations enable row level security;

-- RLS Policies: Users can only insert and view their own consultations
create policy "consultations_insert_authenticated"
  on consultations
  for insert
  to authenticated
  with check (auth.uid()::text = user_id);

create policy "consultations_select_own"
  on consultations
  for select
  to authenticated
  using (auth.uid()::text = user_id);

-- Optional: Allow users to update their own consultations
create policy "consultations_update_own"
  on consultations
  for update
  to authenticated
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- Indexes for performance
create index idx_consultations_user_id on consultations(user_id);
create index idx_consultations_created_at on consultations(created_at desc);
create index idx_consultations_main_purps on consultations(main_purps);

-- GIN indexes for JSONB fields to enable fast queries
create index idx_consultations_address_code_gin on consultations using gin(address_code);
create index idx_consultations_building_info_gin on consultations using gin(building_info);

-- Function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on row changes
create trigger update_consultations_updated_at
  before update on consultations
  for each row
  execute procedure update_updated_at_column();

-- Validation function for Korean phone numbers
create or replace function is_valid_korean_phone(phone_number text)
returns boolean as $$
begin
  return phone_number ~ '^010-[0-9]{4}-[0-9]{4}$';
end;
$$ language 'plpgsql';

-- Add phone validation constraint
alter table consultations
add constraint check_phone_format
check (is_valid_korean_phone(phone));

-- Insert sample data for testing (optional - remove in production)
-- insert into consultations (
--   user_id, nickname, name, phone, email, address, address_code, building_info,
--   main_purps, tot_area, plat_area, ground_floor_cnt, message
-- ) values (
--   'sample-user-id', '테스트닉네임', '홍길동', '010-1234-5678', 'test@example.com',
--   '서울특별시 강남구 테헤란로 123',
--   '{"roadAddr": "서울특별시 강남구 테헤란로 123", "sigunguCd": "11680"}'::jsonb,
--   '{"mainPurpsCdNm": "단독주택", "totArea": "120.50"}'::jsonb,
--   '단독주택', 120.50, 200.00, 2, '건축 관련 상담 요청드립니다.'
-- );