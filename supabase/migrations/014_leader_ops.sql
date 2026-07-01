-- Leader ops: focus banner, weekly goals, nudge audit, link release audit

create table if not exists team_focus_announcements (
  id                    uuid primary key default uuid_generate_v4(),
  message               text not null,
  created_by_member_id  uuid not null references team_members(id) on delete cascade,
  expires_at            timestamptz not null,
  created_at            timestamptz default now()
);

create index if not exists team_focus_expires_idx on team_focus_announcements(expires_at desc);

create table if not exists team_weekly_goals (
  id            uuid primary key default uuid_generate_v4(),
  week_start    date not null unique,
  target_leads  int not null default 40 check (target_leads > 0),
  set_by        text default 'admin',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists leader_nudge_events (
  id                  uuid primary key default uuid_generate_v4(),
  sent_by_member_id   uuid not null references team_members(id) on delete cascade,
  target_member_id    uuid not null references team_members(id) on delete cascade,
  template_key        text not null,
  created_at          timestamptz default now()
);

create index if not exists leader_nudge_sent_idx on leader_nudge_events(sent_by_member_id, created_at desc);

create table if not exists link_release_events (
  id                    uuid primary key default uuid_generate_v4(),
  released_by_member_id uuid not null references team_members(id) on delete cascade,
  target_member_id      uuid not null references team_members(id) on delete cascade,
  link_count            int not null default 0,
  created_at            timestamptz default now()
);

alter table team_focus_announcements enable row level security;
alter table team_weekly_goals enable row level security;
alter table leader_nudge_events enable row level security;
alter table link_release_events enable row level security;
