-- Team leaders approve or mark Sales Nav requests as not eligible (crossed out).
alter table sales_nav_license_requests
  add column if not exists leader_review text not null default 'pending',
  add column if not exists leader_reviewed_at timestamptz,
  add column if not exists leader_reviewed_by uuid references team_members(id) on delete set null,
  add column if not exists leader_review_note text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sales_nav_license_requests_leader_review_check'
  ) then
    alter table sales_nav_license_requests
      add constraint sales_nav_license_requests_leader_review_check
      check (leader_review in ('pending', 'approved', 'not_eligible'));
  end if;
end $$;

create index if not exists sales_nav_license_requests_leader_review_idx
  on sales_nav_license_requests (leader_review);

comment on column sales_nav_license_requests.leader_review is
  'Team leader decision: pending, approved (green for admin), or not_eligible (crossed / cancelled).';
