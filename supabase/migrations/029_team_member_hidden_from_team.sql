-- Admin can hide specific members from team-facing views (leaderboard, victory banners, etc.)
alter table team_members
  add column if not exists hidden_from_team boolean not null default false;

comment on column team_members.hidden_from_team is
  'When true, member is omitted from team leaderboard and announcements for other members; admin still sees everyone.';
