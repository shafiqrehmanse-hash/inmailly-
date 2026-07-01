-- Live chat: outreach members message support; admin assigns team leaders per thread

alter table team_members
  add column if not exists live_chat_agent boolean not null default false;

create table if not exists live_chat_threads (
  id                uuid primary key default uuid_generate_v4(),
  member_id         uuid not null references team_members(id) on delete cascade,
  status            text not null default 'open' check (status in ('open', 'closed')),
  subject           text not null default 'Team support',
  last_message_at   timestamptz default now(),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists live_chat_threads_member_idx on live_chat_threads(member_id, status);
create index if not exists live_chat_threads_last_msg_idx on live_chat_threads(last_message_at desc);

create unique index if not exists live_chat_one_open_per_member
  on live_chat_threads(member_id) where (status = 'open');

create table if not exists live_chat_thread_leaders (
  thread_id     uuid not null references live_chat_threads(id) on delete cascade,
  leader_id     uuid not null references team_members(id) on delete cascade,
  assigned_at   timestamptz default now(),
  primary key (thread_id, leader_id)
);

create index if not exists live_chat_thread_leaders_leader_idx on live_chat_thread_leaders(leader_id);

create table if not exists live_chat_messages (
  id                uuid primary key default uuid_generate_v4(),
  thread_id         uuid not null references live_chat_threads(id) on delete cascade,
  sender_type       text not null check (sender_type in ('member', 'leader', 'admin')),
  sender_member_id  uuid references team_members(id) on delete set null,
  sender_name       text not null,
  body              text not null,
  created_at        timestamptz default now()
);

create index if not exists live_chat_messages_thread_idx on live_chat_messages(thread_id, created_at);

alter table live_chat_threads enable row level security;
alter table live_chat_thread_leaders enable row level security;
alter table live_chat_messages enable row level security;
