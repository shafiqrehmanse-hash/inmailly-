-- Log team member self-serve auto-assign batches (admin visibility)

create table if not exists link_auto_assign_events (
  id            uuid primary key default uuid_generate_v4(),
  member_id     uuid not null references team_members(id) on delete cascade,
  assigned_count int not null check (assigned_count > 0),
  active_before  int not null default 0,
  active_after   int not null,
  pool_remaining int,
  created_at    timestamptz not null default now()
);

create index if not exists link_auto_assign_events_member_idx
  on link_auto_assign_events(member_id, created_at desc);

create index if not exists link_auto_assign_events_created_idx
  on link_auto_assign_events(created_at desc);

alter table link_auto_assign_events enable row level security;
