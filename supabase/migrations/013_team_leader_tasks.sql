-- Team leader role, task assignments, invite code ownership

alter table team_members drop constraint if exists team_members_role_check;
alter table team_members add constraint team_members_role_check
  check (role in ('member', 'senior', 'admin', 'campaign_manager', 'team_leader'));

alter table invite_codes
  add column if not exists created_by_member_id uuid references team_members(id) on delete set null;

create table if not exists team_tasks (
  id                    uuid primary key default uuid_generate_v4(),
  title                 text not null,
  description           text,
  assigned_to           uuid not null references team_members(id) on delete cascade,
  assigned_by_member_id uuid references team_members(id) on delete set null,
  status                text not null default 'pending'
    check (status in ('pending', 'in_progress', 'done')),
  due_at                timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index if not exists team_tasks_assigned_to_idx on team_tasks(assigned_to, status);
create index if not exists team_tasks_created_idx on team_tasks(created_at desc);

alter table team_tasks enable row level security;

drop policy if exists "members read own tasks" on team_tasks;
create policy "members read own tasks" on team_tasks for select
  using (assigned_to = (select id from team_members where user_id = auth.uid()));

drop policy if exists "members update own tasks" on team_tasks;
create policy "members update own tasks" on team_tasks for update
  using (assigned_to = (select id from team_members where user_id = auth.uid()));
