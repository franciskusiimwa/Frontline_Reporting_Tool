-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Enums
create type user_role as enum ('field_staff', 'admin');
create type submission_status as enum ('draft', 'submitted', 'revision_requested', 'approved');
create type audit_action as enum ('created', 'submitted', 'approved', 'revision_requested', 'resubmitted');
create type risk_severity as enum ('H', 'M', 'L');
create type traffic_light as enum ('on_track', 'at_risk', 'off_track');

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  region text,
  role user_role not null default 'field_staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Week configuration (admin-managed)
create table week_config (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,         -- e.g. "Term 2, Week 5"
  term text not null,
  week_number integer not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

-- Ensure only one current week at a time
create unique index only_one_current_week on week_config (is_current) where is_current = true;

-- Submissions
create table submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references profiles(id) on delete set null,
  region text not null,
  week_label text not null references week_config(label),
  status submission_status not null default 'draft',
  data jsonb not null default '{}',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One draft/submission per user per week
  constraint unique_user_week unique (submitted_by, week_label)
);

-- Audit log (append-only, never update or delete)
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade not null,
  actor_id uuid references profiles(id) on delete set null,
  action audit_action not null,
  note text,
  created_at timestamptz not null default now()
);

-- Indexes for common query patterns
create index submissions_region_idx on submissions(region);
create index submissions_week_label_idx on submissions(week_label);
create index submissions_status_idx on submissions(status);
create index submissions_submitted_by_idx on submissions(submitted_by);
create index audit_log_submission_id_idx on audit_log(submission_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

create trigger submissions_updated_at before update on submissions
  for each row execute function update_updated_at();
