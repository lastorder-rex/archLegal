-- Migration: Add address_detail column to consultations table
-- Created: 2025-09-30
-- Description: Add optional address_detail field for detailed address information (e.g., apartment number, building name)

-- Add address_detail column
alter table consultations
add column address_detail text check (length(address_detail) <= 100);

-- Add comment for documentation
comment on column consultations.address_detail is 'Optional detailed address information (max 100 chars) - e.g., apartment number, building name';

-- Create index for address_detail if needed for future queries
create index idx_consultations_address_detail on consultations(address_detail) where address_detail is not null;