-- Manual prerequisite: apply ONLY to the dedicated case-study Supabase project.
-- Contains no medical data. Never run rex migration push for this change.
BEGIN;
CREATE TABLE IF NOT EXISTS public.private_case_login_attempts (
  case_key uuid PRIMARY KEY,
  window_started timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts >= 0)
);
ALTER TABLE public.private_case_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_case_login_attempts FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.private_case_login_attempts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.private_case_login_attempts TO service_role;
CREATE OR REPLACE FUNCTION public.private_case_consume_login_attempt(p_case_key uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE current_attempts integer;
BEGIN
  INSERT INTO public.private_case_login_attempts AS t (case_key, window_started, attempts)
  VALUES (p_case_key, clock_timestamp(), 1)
  ON CONFLICT (case_key) DO UPDATE SET
    attempts = CASE WHEN t.window_started <= clock_timestamp() - interval '15 minutes' THEN 1 ELSE LEAST(t.attempts + 1, 16) END,
    window_started = CASE WHEN t.window_started <= clock_timestamp() - interval '15 minutes' THEN clock_timestamp() ELSE t.window_started END
  RETURNING attempts INTO current_attempts;
  RETURN current_attempts <= 15;
END;
$$;
REVOKE ALL ON FUNCTION public.private_case_consume_login_attempt(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.private_case_consume_login_attempt(uuid) TO service_role;
COMMIT;
