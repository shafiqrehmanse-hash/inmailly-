-- LinkedIn sender profiles assigned to a client campaign (visible in client portal).

create table if not exists client_campaign_profiles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  display_name text not null default '',
  headline text,
  title text,
  linkedin_url text,
  profile_photo_data text,
  cover_photo_data text,
  card_preview_data text,
  sort_order int not null default 0,
  visible_to_client boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_campaign_profiles_project_idx
  on client_campaign_profiles (project_id, sort_order);

create index if not exists client_campaign_profiles_client_idx
  on client_campaign_profiles (client_id);
