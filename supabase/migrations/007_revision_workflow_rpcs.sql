begin;

create or replace function public.submit_submission(p_submission_id uuid, p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.submissions%rowtype;
  v_action public.audit_action;
  v_note text;
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

  if v_submission.status = 'revision_requested' then
    v_action := 'resubmitted';
    v_note := 'Resubmitted after revision request';
  else
    v_action := 'submitted';
    v_note := 'Final submission';
  end if;

  insert into public.audit_log (submission_id, actor_id, action, note)
  values (p_submission_id, auth.uid(), v_action, v_note);

  return p_submission_id;
end;
$$;

create or replace function public.request_submission_revision(p_submission_id uuid, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.submissions%rowtype;
  v_note text;
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
    raise exception 'Only submitted reports can be revision requested';
  end if;

  v_note := coalesce(nullif(trim(p_note), ''), 'Please revise and resubmit this report.');

  update public.submissions
  set status = 'revision_requested'
  where id = p_submission_id;

  insert into public.audit_log (submission_id, actor_id, action, note)
  values (p_submission_id, auth.uid(), 'revision_requested', v_note);

  return p_submission_id;
end;
$$;

revoke all on function public.request_submission_revision(uuid, text) from public;

grant execute on function public.request_submission_revision(uuid, text) to authenticated;

commit;
