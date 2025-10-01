-- Migration: Add attachments support to consultations table
-- Created: 2025-09-30
-- Description: Add attachments field to store file information

-- Add attachments column to consultations table
ALTER TABLE consultations
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN consultations.attachments IS 'Array of attachment file information (filename, size, type, storage_path)';

-- Create index for attachments queries
CREATE INDEX idx_consultations_attachments ON consultations USING GIN(attachments);

-- Add constraint to limit number of attachments (max 3)
ALTER TABLE consultations
ADD CONSTRAINT check_attachments_limit
CHECK (jsonb_array_length(attachments) <= 3);