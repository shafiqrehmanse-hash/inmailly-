-- Team-wide victory banners (deal closed, meeting booked, admin custom events)
create table if not exists team_victory_announcements (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('deal_closed', 'meeting_booked', 'custom', 'birthday')),
  member_id     uuid references team_members(id) on delete set null,
  member_name   text not null,
  lead_name     text,
  message       text,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

create index if not exists team_victory_expires_idx on team_victory_announcements (expires_at desc);
create index if not exists team_victory_created_idx on team_victory_announcements (created_at desc);

-- Meeting booked is a distinct lead milestone
alter table leads drop constraint if exists leads_status_check;
alter table leads add constraint leads_status_check
  check (status in (
    'new', 'contacted', 'replied', 'interested', 'meeting_booked',
    'not_interested', 'follow_up', 'closed', 'dead'
  ));

alter table team_victory_announcements enable row level security;
