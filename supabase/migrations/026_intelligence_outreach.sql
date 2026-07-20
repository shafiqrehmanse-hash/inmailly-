-- Intelligence outreach: named links + AI InMail generation from profile screenshots

alter table outreach_links
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists outreach_mode text
    check (outreach_mode is null or outreach_mode in ('usual', 'intelligence')),
  add column if not exists generated_subject text,
  add column if not exists generated_body text,
  add column if not exists generated_at timestamptz;

create index if not exists outreach_links_intelligence_pool_idx
  on outreach_links (status, created_at desc)
  where status = 'available'
    and member_id is null
    and first_name is not null
    and length(trim(first_name)) > 0;
