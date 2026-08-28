alter table public.viewpoints
  add column captured_at_local timestamp without time zone,
  add column capture_timezone_offset text
    check (capture_timezone_offset is null or capture_timezone_offset ~ '^[+-](0[0-9]|1[0-4]):[0-5][0-9]$');

comment on column public.viewpoints.captured_at_local is
  'Camera-local DateTimeOriginal value; intentionally stored without guessing a timezone.';

comment on column public.viewpoints.capture_timezone_offset is
  'EXIF OffsetTimeOriginal when supplied by the camera, for example +02:00.';
