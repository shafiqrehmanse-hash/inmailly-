-- White-label embed: one downloadable HTML file per project, client self-service

alter table projects
  add column if not exists embed_token text unique,
  add column if not exists whitelabel_enabled boolean not null default false;

create index if not exists projects_embed_token_idx on projects(embed_token);

-- Backfill embed tokens for active projects (optional; new tokens created on client download)
update projects
set embed_token = replace(gen_random_uuid()::text, '-', '')
where embed_token is null and status = 'active';
