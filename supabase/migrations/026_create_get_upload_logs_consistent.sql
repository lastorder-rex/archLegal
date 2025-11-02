-- Create RPC to fetch upload logs from primary DB immediately after mutations
create or replace function public.get_upload_logs_consistent(
  p_consultation_id uuid,
  p_payment_id uuid,
  p_token text
)
returns table (
  id uuid,
  file_name text,
  file_path text,
  mime_type text,
  uploaded_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select
    ul.id,
    ul.file_name,
    ul.file_path,
    ul.mime_type,
    ul.uploaded_at
  from public.upload_logs ul
  where ul.consultation_id = p_consultation_id
    and (
      (p_payment_id is null and ul.payment_id is null)
      or ul.payment_id = p_payment_id
    )
    and ul.upload_token = p_token
  order by ul.uploaded_at desc;
end;
$$;

comment on function public.get_upload_logs_consistent(uuid, uuid, text)
  is 'Fetch upload logs for a consultation/token from the primary to avoid replica lag.';
