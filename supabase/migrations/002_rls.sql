-- Enable RLS on all tables
alter table profiles enable row level security;
alter table submissions enable row level security;
alter table audit_log enable row level security;
alter table week_config enable row level security;

-- Helper: get current user's role
create or replace function get_my_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

-- PROFILES
create policy "Users can read own profile"
  on profiles for select using (id = auth.uid());

create policy "Admins can read all profiles"
  on profiles for select using (get_my_role() = 'admin');

create policy "Admins can insert profiles"
  on profiles for insert with check (get_my_role() = 'admin');

create policy "Admins can update profiles"
  on profiles for update using (get_my_role() = 'admin');

-- SUBMISSIONS
create policy "Field staff can read own submissions"
  on submissions for select using (submitted_by = auth.uid());

create policy "Field staff can insert own submissions"
  on submissions for insert with check (submitted_by = auth.uid());

create policy "Field staff can update own draft or revision_requested submissions"
  on submissions for update using (
    submitted_by = auth.uid()
    and status in ('draft', 'revision_requested')
  );

create policy "Admins can read all submissions"
  on submissions for select using (get_my_role() = 'admin');

create policy "Admins can update submission status"
  on submissions for update using (get_my_role() = 'admin');

-- AUDIT LOG
create policy "Field staff can insert own audit entries"
  on audit_log for insert with check (actor_id = auth.uid());

create policy "Admins can insert audit entries"
  on audit_log for insert with check (get_my_role() = 'admin');

create policy "Admins can read all audit log"
  on audit_log for select using (get_my_role() = 'admin');

create policy "Field staff can read own audit entries"
  on audit_log for select using (
    exists (
      select 1 from submissions s
      where s.id = audit_log.submission_id
      and s.submitted_by = auth.uid()
    )
  );

-- WEEK CONFIG
create policy "Anyone authenticated can read week config"
  on week_config for select using (auth.role() = 'authenticated');

create policy "Admins can manage week config"
  on week_config for all using (get_my_role() = 'admin');
