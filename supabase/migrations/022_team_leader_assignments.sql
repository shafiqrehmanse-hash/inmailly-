-- Each outreach worker reports to one team leader (admin assigns).
-- Leaders only manage members where leader_id = their id.
alter table team_members
  add column if not exists leader_id uuid references team_members(id) on delete set null;

create index if not exists team_members_leader_id_idx on team_members(leader_id);

-- Leaders do not report to other leaders
update team_members set leader_id = null where role = 'team_leader';
