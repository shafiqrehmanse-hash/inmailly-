-- Public blog posts for SEO / content marketing
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body text not null default '',
  cover_image_url text,
  meta_title text,
  meta_description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_status_published_at_idx
  on blog_posts (status, published_at desc nulls last);

create index if not exists blog_posts_slug_idx on blog_posts (slug);
