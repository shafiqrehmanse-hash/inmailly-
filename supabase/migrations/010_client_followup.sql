-- Client-authored follow-up instructions for a logged response (team sends on LinkedIn)
alter table leads
  add column if not exists client_followup_message text,
  add column if not exists client_followup_at timestamptz;

create index if not exists leads_client_followup_idx on leads(project_id, client_followup_at desc)
  where client_followup_message is not null;
