-- Separate InMail subject/body settings + team read access

drop policy if exists "settings read team scripts" on settings;

create policy "settings read team scripts" on settings
  for select using (
    key in (
      'daily_script',
      'script_add_note',
      'script_inmail',
      'script_inmail_subject',
      'script_inmail_body'
    )
  );
