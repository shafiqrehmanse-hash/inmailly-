-- Sales Navigator license requests: team member asks, admin sends activation, member confirms
create table if not exists sales_nav_license_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references team_members(id) on delete cascade,
  member_name text not null,
  member_email text not null,
  linkedin_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'activation_sent', 'activated', 'error')),
  activation_key text,
  member_error_note text,
  requested_at timestamptz not null default now(),
  activation_sent_at timestamptz,
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists sales_nav_license_requests_member_id_idx
  on sales_nav_license_requests (member_id);

create index if not exists sales_nav_license_requests_status_idx
  on sales_nav_license_requests (status);

comment on table sales_nav_license_requests is
  'Team Sales Navigator license workflow: request → admin activation email → member confirms';
