create table if not exists contact_requests (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  email      text not null,
  company    text,
  volume     text,
  message    text,
  status     text default 'new',
  created_at timestamptz default now()
);

alter table contact_requests enable row level security;

drop policy if exists "Anyone can submit contact" on contact_requests;
create policy "Anyone can submit contact" on contact_requests
  for insert with check (true);
