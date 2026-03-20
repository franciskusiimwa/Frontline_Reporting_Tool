-- Normalize profile full names for both existing and future accounts
create or replace function public.derive_display_name(input_name text, email text)
returns text
language sql
immutable
as $$
  select nullif(
    initcap(
      regexp_replace(
        regexp_replace(
          coalesce(nullif(trim(input_name), ''), split_part(coalesce(email, ''), '@', 1)),
          '([a-z])([A-Z])',
          '\1 \2',
          'g'
        ),
        '[._-]+|\s+',
        ' ',
        'g'
      )
    ),
    ''
  )
$$;

-- Recreate trigger function to use normalized names
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, region, role)
  values (
    new.id,
    coalesce(
      public.derive_display_name(new.raw_user_meta_data->>'full_name', new.email),
      'User'
    ),
    new.raw_user_meta_data->>'region',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'field_staff'::user_role)
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    region = coalesce(excluded.region, public.profiles.region);

  return new;
end;
$$;

-- Backfill and normalize existing profile names (admins + field staff)
update public.profiles p
set full_name = coalesce(
  public.derive_display_name(u.raw_user_meta_data->>'full_name', u.email),
  p.full_name
)
from auth.users u
where u.id = p.id
  and (
    p.full_name is null
    or trim(p.full_name) = ''
    or p.full_name ~ '^[[:alnum:]_.-]+$'
    or p.full_name != initcap(p.full_name)
  );
