begin;

create or replace function public.submit_submission(p_submission_id uuid, p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.submissions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  select *
  into v_submission
  from public.submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found';
  end if;

  if v_submission.submitted_by is distinct from auth.uid() then
    raise exception 'Forbidden';
  end if;

  if v_submission.status in ('submitted', 'approved') then
    raise exception 'Already submitted';
  end if;

  update public.submissions
  set
    data = p_payload,
    status = 'submitted',
    submitted_at = now()
  where id = p_submission_id;

  insert into public.audit_log (submission_id, actor_id, action, note)
  values (p_submission_id, auth.uid(), 'submitted', 'Final submission');

  return p_submission_id;
end;
$$;

create or replace function public.approve_submission(p_submission_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.submissions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if public.get_my_role() <> 'admin' then
    raise exception 'Forbidden';
  end if;

  select *
  into v_submission
  from public.submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found';
  end if;

  if v_submission.status <> 'submitted' then
    raise exception 'Only submitted reports can be approved';
  end if;

  update public.submissions
  set status = 'approved'
  where id = p_submission_id;

  insert into public.audit_log (submission_id, actor_id, action, note)
  values (p_submission_id, auth.uid(), 'approved', null);

  return p_submission_id;
end;
$$;

revoke all on function public.submit_submission(uuid, jsonb) from public;
revoke all on function public.approve_submission(uuid) from public;

grant execute on function public.submit_submission(uuid, jsonb) to authenticated;
grant execute on function public.approve_submission(uuid) to authenticated;

commit;