-- Client service agreements: dashboard signing + campaign end notices

create table if not exists client_service_contracts (
  id                uuid primary key default uuid_generate_v4(),
  reference_no      text not null,
  access_token      text unique not null default encode(gen_random_bytes(24), 'hex'),
  client_id         uuid references clients(id) on delete set null,
  project_id        uuid references projects(id) on delete set null,
  contact_name      text not null,
  contact_email     text not null,
  form_data         jsonb not null,
  status            text not null default 'pending_signature'
    check (status in ('pending_signature', 'signed', 'terminated')),
  signature_png     text,
  signed_at         timestamptz,
  sent_at           timestamptz default now(),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists client_service_contracts_client_idx on client_service_contracts(client_id, status);
create index if not exists client_service_contracts_email_idx on client_service_contracts(lower(contact_email));
create index if not exists client_service_contracts_project_idx on client_service_contracts(project_id);
create index if not exists client_service_contracts_token_idx on client_service_contracts(access_token);

create table if not exists client_contract_terminations (
  id                  uuid primary key default uuid_generate_v4(),
  contract_id         uuid not null references client_service_contracts(id) on delete cascade,
  client_id           uuid references clients(id) on delete set null,
  effective_date      date not null,
  inmails_delivered    int not null default 0,
  inmails_remaining   int not null default 0,
  refund_amount_usd   numeric not null default 0,
  reason              text,
  notice_body         text not null,
  notified_at         timestamptz default now(),
  created_at          timestamptz default now()
);

create index if not exists client_contract_terminations_client_idx on client_contract_terminations(client_id);

alter table client_service_contracts enable row level security;
alter table client_contract_terminations enable row level security;
