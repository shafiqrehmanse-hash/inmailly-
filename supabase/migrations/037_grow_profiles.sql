-- In-house LinkedIn profiles the team sends connection requests to (account growth).

create table if not exists grow_profiles (
  id          uuid primary key default uuid_generate_v4(),
  first_name  text not null,
  last_name   text not null default '',
  profile_url text not null,
  url_key     text not null unique,
  batch_name  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists grow_sends (
  id             uuid primary key default uuid_generate_v4(),
  batch_name     text,
  profile_count  integer not null default 0,
  member_count   integer not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists grow_assignments (
  id          uuid primary key default uuid_generate_v4(),
  send_id     uuid references grow_sends(id) on delete set null,
  profile_id  uuid not null references grow_profiles(id) on delete cascade,
  member_id   uuid not null references team_members(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'used')),
  assigned_at timestamptz not null default now(),
  used_at     timestamptz,
  unique (profile_id, member_id)
);

create index if not exists grow_assignments_member_status_idx
  on grow_assignments (member_id, status);
create index if not exists grow_assignments_profile_status_idx
  on grow_assignments (profile_id, status);
create index if not exists grow_assignments_member_used_idx
  on grow_assignments (member_id, used_at);

alter table grow_profiles enable row level security;
alter table grow_sends enable row level security;
alter table grow_assignments enable row level security;

drop policy if exists "members read assigned grow profiles" on grow_profiles;
create policy "members read assigned grow profiles" on grow_profiles for select
  using (
    exists (
      select 1 from grow_assignments a
      where a.profile_id = grow_profiles.id
        and a.member_id = (select id from team_members where user_id = auth.uid())
    )
  );

drop policy if exists "members read own grow assignments" on grow_assignments;
create policy "members read own grow assignments" on grow_assignments for select
  using (member_id = (select id from team_members where user_id = auth.uid()));

drop policy if exists "members update own grow assignments" on grow_assignments;
create policy "members update own grow assignments" on grow_assignments for update
  using (member_id = (select id from team_members where user_id = auth.uid()));

comment on table grow_profiles is
  'InMailly-owned LinkedIn profiles the outreach team connects with to grow our accounts.';
comment on table grow_assignments is
  'Per-member connection-request tasks. Mark used after sending the LinkedIn invite. Cap 10 used per member per UTC day.';
