-- Adds columns supporting the personal-data retention purge (익명화) batch.
-- legal_hold: when true the user is excluded from purge (분쟁/소송 보류).
-- anonymized_at: set once a withdrawn user's PII has been anonymized (재실행 방지).

alter table public.users
  add column if not exists legal_hold boolean not null default false;

alter table public.users
  add column if not exists anonymized_at timestamptz;

comment on column public.users.legal_hold is
  'When true, exclude this user from the expired-PII purge batch (legal/dispute hold).';
comment on column public.users.anonymized_at is
  'Timestamp when the retention-expired PII purge anonymized this withdrawn user. Prevents re-processing.';

-- Speeds up candidate lookups: withdrawn users not yet anonymized and not on hold.
create index if not exists users_pii_purge_candidates_idx
  on public.users (account_status, anonymized_at, legal_hold);
