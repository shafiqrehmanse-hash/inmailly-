-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Team members ──────────────────────────────────
create table team_members (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  email       text unique not null,
  phone       text,
  photo_url   text,
  role        text default 'member' check (role in ('member','senior','admin')),
  is_active   boolean default true,
  invite_code text,
  joined_at   timestamptz default now(),
  last_login  timestamptz
);

-- ── Invite codes ──────────────────────────────────
create table invite_codes (
  id          uuid primary key default uuid_generate_v4(),
  code        text unique not null,
  label       text,
  uses_left   int default 10,
  used_count  int default 0,
  created_at  timestamptz default now()
);
insert into invite_codes (code, label, uses_left) values ('INMAILLY-JOIN', 'Default invite', 10);

-- ── Outreach links ────────────────────────────────
create table outreach_links (
  id                  uuid primary key default uuid_generate_v4(),
  url                 text not null,
  url_key             text unique not null,
  smart_label         text,
  category            text default 'linkedin' check (category in ('linkedin','salesnav','email','general')),
  batch_name          text,
  status              text default 'available' check (status in ('available','claimed','used')),
  member_id           uuid references team_members(id) on delete set null,
  claimed_at          timestamptz,
  used_at             timestamptz,
  used_by_member_id   uuid references team_members(id) on delete set null,
  ai_hint             text,
  notes               text,
  added_by            text default 'Admin',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create index on outreach_links(status);
create index on outreach_links(member_id);

-- ── Leads ─────────────────────────────────────────
create table leads (
  id              uuid primary key default uuid_generate_v4(),
  member_id       uuid not null references team_members(id) on delete cascade,
  name            text not null,
  profile_url     text,
  company         text,
  position        text,
  email           text,
  phone           text,
  status          text default 'new' check (status in ('new','contacted','replied','interested','closed','dead')),
  deal_closed     boolean default false,
  closed_at       timestamptz,
  notes           text,
  source_link_id  uuid references outreach_links(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index on leads(member_id);
create index on leads(status);

-- ── Lead messages ─────────────────────────────────
create table lead_messages (
  id          uuid primary key default uuid_generate_v4(),
  lead_id     uuid not null references leads(id) on delete cascade,
  sender      text not null check (sender in ('team','lead')),
  sender_name text not null,
  msg_type    text default 'message' check (msg_type in ('message','followup','reply','inmail','note')),
  content     text not null,
  created_at  timestamptz default now()
);
create index on lead_messages(lead_id);

-- ── Referrals ─────────────────────────────────────
create table referrals (
  id              uuid primary key default uuid_generate_v4(),
  referrer_id     uuid not null references team_members(id) on delete cascade,
  referred_email  text not null,
  referred_name   text,
  status          text default 'pending' check (status in ('pending','joined','converted')),
  reward_pkr      numeric(12,2) default 0,
  created_at      timestamptz default now()
);

-- ── Member funds ──────────────────────────────────
create table member_funds (
  id          uuid primary key default uuid_generate_v4(),
  member_id   uuid not null references team_members(id) on delete cascade,
  amount_pkr  numeric(12,2) not null default 0,
  note        text default '',
  added_by    text default 'Admin',
  added_at    timestamptz default now()
);

-- ── Settings ──────────────────────────────────────
create table settings (
  key   text primary key,
  value text
);

-- ── RLS Policies ─────────────────────────────────
alter table team_members enable row level security;
alter table outreach_links enable row level security;
alter table leads enable row level security;
alter table lead_messages enable row level security;
alter table referrals enable row level security;
alter table member_funds enable row level security;
alter table settings enable row level security;
alter table invite_codes enable row level security;

create policy "members read own" on team_members for select using (user_id = auth.uid());
create policy "members read all active" on team_members for select using (is_active = true);

create policy "links read all" on outreach_links for select using (true);
create policy "links update own" on outreach_links for update using (
  member_id = (select id from team_members where user_id = auth.uid())
  or status = 'available'
);

create policy "leads own" on leads for all using (
  member_id = (select id from team_members where user_id = auth.uid())
);

create policy "messages own leads" on lead_messages for all using (
  lead_id in (
    select id from leads where member_id = (
      select id from team_members where user_id = auth.uid()
    )
  )
);

create policy "funds own" on member_funds for select using (
  member_id = (select id from team_members where user_id = auth.uid())
);

create policy "referrals own" on referrals for all using (
  referrer_id = (select id from team_members where user_id = auth.uid())
);

create policy "settings read daily script" on settings for select using (key = 'daily_script');
