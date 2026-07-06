-- Content manager role + blog author profiles + approval workflow

alter table team_members drop constraint if exists team_members_role_check;
alter table team_members add constraint team_members_role_check
  check (role in (
    'member', 'senior', 'admin', 'campaign_manager', 'team_leader', 'content_manager'
  ));

alter table team_members
  add column if not exists author_bio text,
  add column if not exists author_title text;

alter table blog_posts drop constraint if exists blog_posts_status_check;
alter table blog_posts add constraint blog_posts_status_check
  check (status in ('draft', 'pending_review', 'published', 'rejected'));

alter table blog_posts
  add column if not exists author_id uuid references team_members(id) on delete set null,
  add column if not exists category text,
  add column if not exists review_note text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz;

create index if not exists blog_posts_author_id_idx on blog_posts (author_id);
create index if not exists blog_posts_category_idx on blog_posts (category);
create index if not exists blog_posts_pending_idx on blog_posts (status) where status = 'pending_review';
