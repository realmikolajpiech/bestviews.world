create extension if not exists unaccent with schema extensions;

alter table public.profiles
  add column if not exists username text;

create or replace function public.username_slug(value text)
returns text
language sql
stable
set search_path = ''
as $$
  select trim(both '-' from left(
    trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g')),
    30
  ));
$$;

create or replace function public.available_username(desired text, owner_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text := public.username_slug(desired);
  candidate text;
  suffix_number integer := 2;
begin
  if char_length(base) < 3 then
    base := 'traveler';
  end if;

  perform pg_advisory_xact_lock(hashtext(base));
  candidate := base;

  if not exists (
    select 1 from public.profiles
    where username = candidate and id <> owner_id
  ) then
    return candidate;
  end if;

  candidate := left(base, 21) || '-' || left(owner_id::text, 8);
  while exists (
    select 1 from public.profiles
    where username = candidate and id <> owner_id
  ) loop
    candidate := left(base, 26 - char_length(suffix_number::text)) || '-' || suffix_number::text;
    suffix_number := suffix_number + 1;
  end loop;

  return candidate;
end;
$$;

do $$
declare
  profile_record record;
begin
  for profile_record in
    select id, display_name from public.profiles where username is null order by created_at, id
  loop
    update public.profiles
    set username = public.available_username(profile_record.display_name, profile_record.id)
    where id = profile_record.id;
  end loop;
end;
$$;

alter table public.profiles
  alter column username set not null;

alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format
  check (username ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$');

create unique index if not exists profiles_username_key
  on public.profiles (username);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  chosen_name text := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'Traveler');
begin
  insert into public.profiles (id, display_name, username, avatar_url)
  values (
    new.id,
    chosen_name,
    public.available_username(coalesce(nullif(split_part(new.email, '@', 1), ''), chosen_name), new.id),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
