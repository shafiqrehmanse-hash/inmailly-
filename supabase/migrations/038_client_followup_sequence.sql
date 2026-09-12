-- Conversation sequence after a client follow-up: lead replies again, client writes the next send.

create table if not exists client_followup_steps (
  id          uuid primary key default uuid_generate_v4(),
  lead_id     uuid not null references leads(id) on delete cascade,
  project_id  uuid not null references projects(id) on delete cascade,
  kind        text not null check (kind in ('lead_reply', 'client_send')),
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists client_followup_steps_lead_idx
  on client_followup_steps (lead_id, created_at);
create index if not exists client_followup_steps_project_idx
  on client_followup_steps (project_id, created_at desc);

alter table client_followup_steps enable row level security;

drop policy if exists "campaign read followup steps" on client_followup_steps;
create policy "campaign read followup steps" on client_followup_steps for select
  using (
    project_id in (
      select project_id from project_assignments
      where member_id = (select id from team_members where user_id = auth.uid())
    )
  );

comment on table client_followup_steps is
  'Ordered follow-up sequence: client_send (what team should send) and lead_reply (what the lead said next).';
