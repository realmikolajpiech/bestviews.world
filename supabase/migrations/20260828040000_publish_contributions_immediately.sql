-- BestViews publishes community contributions immediately. Moderators retain
-- the ability to remove harmful content after publication.

update public.viewpoints set status = 'published' where status = 'pending';
update public.viewpoint_photos set status = 'approved' where status = 'pending';
update public.tips set status = 'approved' where status = 'pending';

alter table public.viewpoints alter column status set default 'published';
alter table public.viewpoint_photos alter column status set default 'approved';
alter table public.tips alter column status set default 'approved';

drop policy if exists "users submit viewpoints" on public.viewpoints;
create policy "users publish viewpoints" on public.viewpoints for insert to authenticated
with check (contributor_id = auth.uid() and status in ('draft', 'published'));

drop policy if exists "users edit pending viewpoints" on public.viewpoints;
create policy "users edit own viewpoints" on public.viewpoints for update to authenticated
using (contributor_id = auth.uid() and status in ('draft', 'published'))
with check (contributor_id = auth.uid() and status in ('draft', 'published'));

drop policy if exists "users delete drafts" on public.viewpoints;
create policy "users delete own viewpoints" on public.viewpoints for delete to authenticated
using (contributor_id = auth.uid() and status in ('draft', 'published'));

drop policy if exists "users remove own pending tips" on public.tips;
create policy "users remove own tips" on public.tips for delete to authenticated
using (author_id = auth.uid());
