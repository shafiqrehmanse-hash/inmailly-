-- Member LinkedIn profile URL for team contact cards (admin / leader popup).
alter table team_members
  add column if not exists linkedin_url text;

comment on column team_members.linkedin_url is
  'Public LinkedIn profile URL the member adds in team settings.';
