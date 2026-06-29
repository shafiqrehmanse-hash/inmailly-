-- Proof of InMail sends (screenshots uploaded by campaign managers)
create table if not exists send_proofs (
  id                uuid primary key default uuid_generate_v4(),
  project_id        uuid not null references projects(id) on delete cascade,
  uploaded_by       uuid not null references team_members(id) on delete cascade,
  original_path     text not null,
  display_path      text not null,
  visible_to_client boolean default true,
  caption           text,
  created_at        timestamptz default now()
);

create index if not exists send_proofs_project_idx on send_proofs(project_id);
create index if not exists send_proofs_created_idx on send_proofs(created_at desc);

alter table send_proofs enable row level security;

-- Campaign managers read proofs for assigned projects
create policy "proofs via project assignment" on send_proofs for select using (
  project_id in (
    select project_id from project_assignments
    where member_id = (select id from team_members where user_id = auth.uid())
  )
);

create policy "proofs insert assigned" on send_proofs for insert with check (
  project_id in (
    select project_id from project_assignments
    where member_id = (select id from team_members where user_id = auth.uid())
  )
  and uploaded_by = (select id from team_members where user_id = auth.uid())
);

create policy "proofs delete own upload" on send_proofs for delete using (
  uploaded_by = (select id from team_members where user_id = auth.uid())
);

create policy "proofs update assigned" on send_proofs for update using (
  project_id in (
    select project_id from project_assignments
    where member_id = (select id from team_members where user_id = auth.uid())
  )
);

-- Supabase Storage bucket (run in SQL editor if storage insert fails)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proof-screenshots',
  'proof-screenshots',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
