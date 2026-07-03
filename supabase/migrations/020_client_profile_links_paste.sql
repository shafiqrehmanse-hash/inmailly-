-- Client-submitted profile link paste (bulk URLs with branding)

alter table projects
  add column if not exists client_profile_links_paste text,
  add column if not exists client_profile_links_parsed integer,
  add column if not exists client_profile_links_imported integer;
