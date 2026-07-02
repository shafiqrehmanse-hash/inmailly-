-- Client branding: admin requests, client submits InMail + Sales Nav details

alter table projects
  add column if not exists inmail_subject text,
  add column if not exists sales_nav_direct_link text,
  add column if not exists sales_nav_link_count integer,
  add column if not exists branding_submitted_at timestamptz;

create table if not exists client_branding_requests (
  id                uuid primary key default uuid_generate_v4(),
  client_id         uuid not null references clients(id) on delete cascade,
  project_id        uuid not null references projects(id) on delete cascade,
  status            text not null default 'pending'
    check (status in ('pending', 'submitted')),
  package_size      integer,
  requested_at      timestamptz default now(),
  submitted_at      timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists client_branding_requests_client_idx on client_branding_requests(client_id, status);
create index if not exists client_branding_requests_project_idx on client_branding_requests(project_id);

alter table client_branding_requests enable row level security;
