-- Team script settings + member profile updates

drop policy if exists "settings read daily script" on settings;

create policy "settings read team scripts" on settings
  for select using (
    key in ('daily_script', 'script_add_note', 'script_inmail')
  );

create policy "members update own profile" on team_members
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Expand lead status options to match outreach workflow
alter table leads drop constraint if exists leads_status_check;
alter table leads add constraint leads_status_check
  check (status in (
    'new', 'contacted', 'replied', 'interested',
    'not_interested', 'follow_up', 'closed', 'dead'
  ));
