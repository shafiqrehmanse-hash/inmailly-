-- Campaign manager role (separate from outreach workers)
alter table team_members drop constraint if exists team_members_role_check;
alter table team_members add constraint team_members_role_check
  check (role in ('member', 'senior', 'admin', 'campaign_manager'));

-- Website CMS sections (admin-managed, served via API)
create table if not exists site_content (
  section    text primary key,
  data       jsonb not null default '{}',
  updated_at timestamptz default now()
);

create index if not exists site_content_updated_idx on site_content(updated_at desc);
