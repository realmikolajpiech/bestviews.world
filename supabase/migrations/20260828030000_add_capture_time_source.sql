alter table public.viewpoints
  add column capture_time_source text
    check (capture_time_source is null or capture_time_source in ('exif', 'file'));

comment on column public.viewpoints.capture_time_source is
  'Whether captured_at_local came from embedded EXIF or the less reliable File.lastModified fallback.';
