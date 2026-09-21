-- Grant selected team leaders access to Sales Navigator requests for their assigned members only.
alter table team_members
  add column if not exists sales_nav_agent boolean not null default false;

comment on column team_members.sales_nav_agent is
  'When true, this team leader can view Sales Navigator license requests for members assigned to them.';
