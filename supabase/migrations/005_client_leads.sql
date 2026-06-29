-- Separate client-project responses from team marketing lead pool
alter table leads
  add column if not exists project_id uuid references projects(id) on delete set null,
  add column if not exists visible_to_client boolean not null default false;

alter table projects
  add column if not exists portal_token text unique;

update projects
set portal_token = replace(gen_random_uuid()::text, '-', '')
where portal_token is null;

create index if not exists leads_project_id_idx on leads(project_id);
create index if not exists leads_visible_client_idx on leads(project_id, visible_to_client)
  where visible_to_client = true;

-- Tighten leads RLS: marketing pool (no project) + assigned project leads only
drop policy if exists "leads own" on leads;

create policy "leads member access" on leads for all
  using (
    member_id = (select id from team_members where user_id = auth.uid())
  )
  with check (
    member_id = (select id from team_members where user_id = auth.uid())
    and (
      project_id is null
      or project_id in (
        select project_id from project_assignments
        where member_id = (select id from team_members where user_id = auth.uid())
      )
    )
  );
