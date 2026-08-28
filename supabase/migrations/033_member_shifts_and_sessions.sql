-- Daily campaign start/done logs and live work-session time tracking.

create table if not exists member_campaign_shifts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references team_members(id) on delete cascade,
  work_date date not null default (timezone('utc', now()))::date,
  started_at timestamptz,
  completed_at timestamptz,
  sends_count int,
  status text not null default 'idle'
    check (status in ('idle', 'started', 'done')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, work_date)
);

create index if not exists member_campaign_shifts_date_idx
  on member_campaign_shifts (work_date desc, status);

create table if not exists member_work_sessions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references team_members(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_heartbeat_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists member_work_sessions_member_idx
  on member_work_sessions (member_id, started_at desc);

create index if not exists member_work_sessions_open_idx
  on member_work_sessions (member_id)
  where ended_at is null;

alter table member_campaign_shifts enable row level security;
alter table member_work_sessions enable row level security;

create policy "campaign_shifts_own_read" on member_campaign_shifts
  for select using (
    member_id = (select id from team_members where user_id = auth.uid())
  );

create policy "work_sessions_own_read" on member_work_sessions
  for select using (
    member_id = (select id from team_members where user_id = auth.uid())
  );
