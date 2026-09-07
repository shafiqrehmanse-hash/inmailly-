-- Re-request Sales Navigator: reason, credits vs error, optional screenshot
alter table sales_nav_license_requests
  add column if not exists rerequest_kind text
    check (rerequest_kind is null or rerequest_kind in ('credits_completed', 'error')),
  add column if not exists rerequest_reason text,
  add column if not exists screenshot_url text;

comment on column sales_nav_license_requests.rerequest_kind is
  'Why they asked again: credits used up, or an error (screenshot expected).';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sales-nav-screenshots',
  'sales-nav-screenshots',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;
