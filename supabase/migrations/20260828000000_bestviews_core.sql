create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.viewpoints (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  contributor_id uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 2 and 100),
  short_title text,
  region text not null check (char_length(region) between 1 and 100),
  country text not null check (char_length(country) between 1 and 100),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  look_direction text not null check (char_length(look_direction) between 3 and 180),
  category text not null check (category in ('Sunsets', 'Mountains', 'City lights', 'Coastlines', 'Hidden gems')),
  best_time text,
  best_season text,
  difficulty text,
  cost text,
  access_summary text,
  description text check (description is null or char_length(description) <= 600),
  tip text check (tip is null or char_length(tip) <= 400),
  cover_photo_path text,
  status text not null default 'pending' check (status in ('draft', 'pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index viewpoints_status_created_idx on public.viewpoints(status, created_at desc);
create index viewpoints_location_idx on public.viewpoints(latitude, longitude);
create index viewpoints_contributor_idx on public.viewpoints(contributor_id, created_at desc);

create table public.viewpoint_photos (
  id uuid primary key default gen_random_uuid(),
  viewpoint_id uuid not null references public.viewpoints(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  caption text check (caption is null or char_length(caption) <= 180),
  captured_at date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  viewpoint_id uuid not null references public.viewpoints(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, viewpoint_id)
);

create table public.visits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  viewpoint_id uuid not null references public.viewpoints(id) on delete cascade,
  visited_at date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (user_id, viewpoint_id)
);

create table public.tips (
  id uuid primary key default gen_random_uuid(),
  viewpoint_id uuid not null references public.viewpoints(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 4 and 280),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  viewpoint_id uuid not null references public.viewpoints(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (collection_id, viewpoint_id)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger set_viewpoints_updated_at before update on public.viewpoints
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'Traveler'),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

alter table public.profiles enable row level security;
alter table public.viewpoints enable row level security;
alter table public.viewpoint_photos enable row level security;
alter table public.saves enable row level security;
alter table public.visits enable row level security;
alter table public.tips enable row level security;
alter table public.follows enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "published viewpoints are public" on public.viewpoints for select
using (status = 'published' or contributor_id = auth.uid() or public.is_moderator());
create policy "users submit viewpoints" on public.viewpoints for insert to authenticated
with check (contributor_id = auth.uid() and status in ('draft', 'pending'));
create policy "users edit pending viewpoints" on public.viewpoints for update to authenticated
using (contributor_id = auth.uid() and status in ('draft', 'pending'))
with check (contributor_id = auth.uid() and status in ('draft', 'pending'));
create policy "users delete drafts" on public.viewpoints for delete to authenticated
using (contributor_id = auth.uid() and status = 'draft');
create policy "moderators manage viewpoints" on public.viewpoints for all to authenticated
using (public.is_moderator()) with check (public.is_moderator());

create policy "approved photos are public" on public.viewpoint_photos for select
using (status = 'approved' or uploader_id = auth.uid() or public.is_moderator());
create policy "users add photos" on public.viewpoint_photos for insert to authenticated
with check (uploader_id = auth.uid());
create policy "moderators manage photos" on public.viewpoint_photos for all to authenticated
using (public.is_moderator()) with check (public.is_moderator());

create policy "users read own saves" on public.saves for select to authenticated using (user_id = auth.uid());
create policy "users create own saves" on public.saves for insert to authenticated with check (user_id = auth.uid());
create policy "users remove own saves" on public.saves for delete to authenticated using (user_id = auth.uid());

create policy "users read own visits" on public.visits for select to authenticated using (user_id = auth.uid());
create policy "users create own visits" on public.visits for insert to authenticated with check (user_id = auth.uid());
create policy "users remove own visits" on public.visits for delete to authenticated using (user_id = auth.uid());

create policy "approved tips are public" on public.tips for select
using (status = 'approved' or author_id = auth.uid() or public.is_moderator());
create policy "users submit tips" on public.tips for insert to authenticated with check (author_id = auth.uid());
create policy "users remove own pending tips" on public.tips for delete to authenticated
using (author_id = auth.uid() and status = 'pending');
create policy "moderators manage tips" on public.tips for all to authenticated
using (public.is_moderator()) with check (public.is_moderator());

create policy "follows are public" on public.follows for select using (true);
create policy "users follow" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "users unfollow" on public.follows for delete to authenticated using (follower_id = auth.uid());

create policy "public collections are visible" on public.collections for select
using (is_public or owner_id = auth.uid());
create policy "users create collections" on public.collections for insert to authenticated with check (owner_id = auth.uid());
create policy "users manage collections" on public.collections for update to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "users delete collections" on public.collections for delete to authenticated using (owner_id = auth.uid());

create policy "collection items follow visibility" on public.collection_items for select
using (exists (select 1 from public.collections c where c.id = collection_id and (c.is_public or c.owner_id = auth.uid())));
create policy "collection owners add items" on public.collection_items for insert to authenticated
with check (exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = auth.uid()));
create policy "collection owners remove items" on public.collection_items for delete to authenticated
using (exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('viewpoint-photos', 'viewpoint-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "viewpoint photos are public" on storage.objects for select
using (bucket_id = 'viewpoint-photos');
create policy "users upload viewpoint photos" on storage.objects for insert to authenticated
with check (bucket_id = 'viewpoint-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update own viewpoint photos" on storage.objects for update to authenticated
using (bucket_id = 'viewpoint-photos' and owner_id = auth.uid()::text)
with check (bucket_id = 'viewpoint-photos' and owner_id = auth.uid()::text);
create policy "users delete own viewpoint photos" on storage.objects for delete to authenticated
using (bucket_id = 'viewpoint-photos' and owner_id = auth.uid()::text);
