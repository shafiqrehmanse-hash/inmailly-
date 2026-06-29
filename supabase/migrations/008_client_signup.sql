-- Client self-signup (links Supabase Auth to clients + preview projects)
alter table clients add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table clients add column if not exists   signup_source text default 'admin'
  check (signup_source in ('admin', 'self'));

alter table projects drop constraint if exists projects_status_check;
alter table projects add constraint projects_status_check
  check (status in ('draft', 'preview', 'active', 'paused', 'completed'));

create unique index if not exists clients_user_id_unique on clients(user_id) where user_id is not null;
create index if not exists clients_signup_source_idx on clients(signup_source);

-- Clients read their own record
drop policy if exists "clients read own" on clients;
create policy "clients read own" on clients for select using (user_id = auth.uid());

-- Clients read their projects
drop policy if exists "projects client owner" on projects;
create policy "projects client owner" on projects for select using (
  client_id in (select id from clients where user_id = auth.uid())
);

-- Clients read visible leads on their projects
drop policy if exists "leads client portal" on leads;
create policy "leads client portal" on leads for select using (
  visible_to_client = true
  and project_id in (
    select p.id from projects p
    join clients c on c.id = p.client_id
    where c.user_id = auth.uid()
  )
);

-- Clients read visible send proofs
drop policy if exists "proofs client portal" on send_proofs;
create policy "proofs client portal" on send_proofs for select using (
  visible_to_client = true
  and project_id in (
    select p.id from projects p
    join clients c on c.id = p.client_id
    where c.user_id = auth.uid()
  )
);
