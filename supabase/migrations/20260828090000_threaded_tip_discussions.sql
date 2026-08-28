alter table public.tips
  add column if not exists parent_id uuid;

create unique index if not exists tips_id_viewpoint_key
  on public.tips (id, viewpoint_id);

alter table public.tips
  drop constraint if exists tips_parent_same_viewpoint;

alter table public.tips
  add constraint tips_parent_same_viewpoint
  foreign key (parent_id, viewpoint_id)
  references public.tips (id, viewpoint_id)
  on delete cascade;

alter table public.tips
  drop constraint if exists tips_parent_not_self;

alter table public.tips
  add constraint tips_parent_not_self
  check (parent_id is null or parent_id <> id);

create index if not exists tips_thread_idx
  on public.tips (viewpoint_id, parent_id, created_at);
