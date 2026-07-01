-- Employment contracts: dashboard signing + termination notices

create table if not exists employment_contracts (
  id                uuid primary key default uuid_generate_v4(),
  reference_no      text not null,
  access_token      text unique not null default encode(gen_random_bytes(24), 'hex'),
  member_id         uuid references team_members(id) on delete set null,
  candidate_name    text not null,
  candidate_email   text not null,
  form_data         jsonb not null,
  status            text not null default 'pending_signature'
    check (status in ('pending_signature', 'signed', 'terminated')),
  signature_png     text,
  signed_at         timestamptz,
  sent_at           timestamptz default now(),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists employment_contracts_member_idx on employment_contracts(member_id, status);
create index if not exists employment_contracts_email_idx on employment_contracts(lower(candidate_email));
create index if not exists employment_contracts_token_idx on employment_contracts(access_token);

create table if not exists contract_terminations (
  id                  uuid primary key default uuid_generate_v4(),
  contract_id         uuid not null references employment_contracts(id) on delete cascade,
  member_id           uuid references team_members(id) on delete set null,
  effective_date      date not null,
  total_days_worked   int not null default 0,
  pending_amount_pkr  numeric not null default 0,
  reason              text,
  notice_body         text not null,
  notified_at         timestamptz default now(),
  created_at          timestamptz default now()
);

create index if not exists contract_terminations_member_idx on contract_terminations(member_id);

alter table employment_contracts enable row level security;
alter table contract_terminations enable row level security;
