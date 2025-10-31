-- Add updated_at column to upload_logs for cache busting
ALTER TABLE public.upload_logs 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now());

-- Create trigger to update updated_at on any change
CREATE OR REPLACE FUNCTION update_upload_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_upload_logs_updated_at ON public.upload_logs;
CREATE TRIGGER set_upload_logs_updated_at
  BEFORE UPDATE ON public.upload_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_upload_logs_updated_at();
