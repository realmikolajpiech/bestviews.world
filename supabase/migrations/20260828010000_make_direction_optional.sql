do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'viewpoints'
      and column_name = 'look_direction'
  ) then
    alter table public.viewpoints alter column look_direction drop not null;
  end if;
end $$;
