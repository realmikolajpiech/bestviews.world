-- Sharing a published viewpoint is itself evidence that the contributor has
-- been there. Keep this invariant in the database for every client.

create or replace function public.mark_viewpoint_contributor_visited()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' and new.contributor_id is not null then
    insert into public.visits (user_id, viewpoint_id, visited_at)
    values (
      new.contributor_id,
      new.id,
      coalesce(new.captured_at_local::date, new.created_at::date, current_date)
    )
    on conflict (user_id, viewpoint_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists mark_viewpoint_contributor_visited on public.viewpoints;
create trigger mark_viewpoint_contributor_visited
after insert or update of status on public.viewpoints
for each row execute function public.mark_viewpoint_contributor_visited();

-- Apply the same rule to viewpoints that already exist.
insert into public.visits (user_id, viewpoint_id, visited_at)
select
  contributor_id,
  id,
  coalesce(captured_at_local::date, created_at::date, current_date)
from public.viewpoints
where contributor_id is not null and status = 'published'
on conflict (user_id, viewpoint_id) do nothing;
