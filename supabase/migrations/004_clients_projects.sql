-- Clients (companies you run outreach for)
create table clients (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  company_name  text,
  email         text,
  logo_url      text,
  notes         text,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Outreach projects scoped to a client
create table projects (
  id                 uuid primary key default uuid_generate_v4(),
  client_id          uuid not null references clients(id) on delete cascade,
  name               text not null,
  audience_brief     text,
  target_titles      text,
  target_industries  text,
  target_regions     text,
  connection_script  text,
  inmail_script      text,
  followup_script    text,
  status             text default 'active' check (status in ('draft', 'active', 'paused', 'completed')),
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- Team members assigned to a project
create table project_assignments (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references projects(id) on delete cascade,
  member_id   uuid not null references team_members(id) on delete cascade,
  assigned_at timestamptz default now(),
  assigned_by text default 'Admin',
  unique (project_id, member_id)
);

create index on projects(client_id);
create index on projects(status);
create index on project_assignments(member_id);
create index on project_assignments(project_id);

alter table clients enable row level security;
alter table projects enable row level security;
alter table project_assignments enable row level security;

-- Team reads clients only for projects they are assigned to
create policy "clients via assignment" on clients for select using (
  id in (
    select p.client_id
    from projects p
    join project_assignments pa on pa.project_id = p.id
    where pa.member_id = (select id from team_members where user_id = auth.uid())
  )
);

create policy "projects assigned" on projects for select using (
  id in (
    select project_id from project_assignments
    where member_id = (select id from team_members where user_id = auth.uid())
  )
);

create policy "assignments own" on project_assignments for select using (
  member_id = (select id from team_members where user_id = auth.uid())
);
