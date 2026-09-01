-- Client live chat: portal widget → admin inbox + email notify

create table if not exists client_live_chat_threads (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id) on delete cascade,
  status          text not null default 'open' check (status in ('open', 'closed')),
  subject         text not null default 'Client support',
  last_message_at timestamptz default now(),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists client_live_chat_threads_client_idx
  on client_live_chat_threads (client_id, status);

create index if not exists client_live_chat_threads_last_msg_idx
  on client_live_chat_threads (last_message_at desc);

create unique index if not exists client_live_chat_one_open_per_client
  on client_live_chat_threads (client_id) where (status = 'open');

create table if not exists client_live_chat_messages (
  id            uuid primary key default uuid_generate_v4(),
  thread_id     uuid not null references client_live_chat_threads(id) on delete cascade,
  sender_type   text not null check (sender_type in ('client', 'admin')),
  sender_name   text not null,
  body          text not null,
  created_at    timestamptz default now()
);

create index if not exists client_live_chat_messages_thread_idx
  on client_live_chat_messages (thread_id, created_at);

alter table client_live_chat_threads enable row level security;
alter table client_live_chat_messages enable row level security;

comment on table client_live_chat_threads is
  'Client portal support chat. Messages are stored here; APIs use the service role.';
