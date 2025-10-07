-- Add optional birth date to users profile
alter table users
  add column if not exists birth_date date;
