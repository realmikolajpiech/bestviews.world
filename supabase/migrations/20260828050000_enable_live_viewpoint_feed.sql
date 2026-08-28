-- Broadcast published viewpoint changes so open feeds update without a refresh.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'viewpoints'
  ) then
    alter publication supabase_realtime add table public.viewpoints;
  end if;
end $$;

alter table public.viewpoints replica identity full;
