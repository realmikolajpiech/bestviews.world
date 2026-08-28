alter table public.profiles
  add column if not exists bio text check (bio is null or char_length(bio) <= 240),
  add column if not exists location text check (location is null or char_length(location) <= 100),
  add column if not exists social_url text check (social_url is null or char_length(social_url) <= 500);

alter table public.profiles
  add constraint profiles_social_url_http
  check (social_url is null or social_url ~* '^https?://');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', true, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "profile avatars are public" on storage.objects for select
using (bucket_id = 'profile-avatars');

create policy "users upload own profile avatar" on storage.objects for insert to authenticated
with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update own profile avatar" on storage.objects for update to authenticated
using (bucket_id = 'profile-avatars' and owner_id = auth.uid()::text)
with check (bucket_id = 'profile-avatars' and owner_id = auth.uid()::text);

create policy "users delete own profile avatar" on storage.objects for delete to authenticated
using (bucket_id = 'profile-avatars' and owner_id = auth.uid()::text);
