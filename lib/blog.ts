import { createAdminClient } from "@/lib/supabase/admin";

export type BlogPostStatus = "draft" | "pending_review" | "published" | "rejected";

export type BlogAuthor = {
  id: string;
  name: string;
  photo_url: string | null;
  author_title: string | null;
  author_bio: string | null;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: BlogPostStatus;
  author_id: string | null;
  category: string | null;
  review_note: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPostWithAuthor = BlogPost & { author: BlogAuthor | null };

const AUTHOR_SELECT = "id, name, photo_url, author_title, author_bio";

export function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function mapAuthor(row: Record<string, unknown> | null | undefined): BlogAuthor | null {
  if (!row || typeof row.id !== "string") return null;
  return {
    id: row.id,
    name: String(row.name || ""),
    photo_url: (row.photo_url as string | null) ?? null,
    author_title: (row.author_title as string | null) ?? null,
    author_bio: (row.author_bio as string | null) ?? null,
  };
}

function mapPostWithAuthor(row: Record<string, unknown>): BlogPostWithAuthor {
  const authorRaw = row.author ?? row.team_members;
  const author = Array.isArray(authorRaw)
    ? mapAuthor(authorRaw[0] as Record<string, unknown>)
    : mapAuthor(authorRaw as Record<string, unknown> | null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { team_members: _tm, author: _author, ...post } = row;
  return { ...(post as BlogPost), author };
}

export async function getPublishedBlogPosts(
  limit?: number,
  category?: string | null
): Promise<BlogPostWithAuthor[]> {
  const admin = createAdminClient();
  let q = admin
    .from("blog_posts")
    .select(`*, author:team_members!author_id (${AUTHOR_SELECT})`)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (category) q = q.eq("category", category);
  if (limit) q = q.limit(limit);

  const { data, error } = await q;
  if (error) {
    console.error("getPublishedBlogPosts:", error.message);
    return [];
  }
  return (data || []).map((row) => mapPostWithAuthor(row as Record<string, unknown>));
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPostWithAuthor | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .select(`*, author:team_members!author_id (${AUTHOR_SELECT})`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("getPublishedBlogPostBySlug:", error.message);
    return null;
  }
  if (!data) return null;
  return mapPostWithAuthor(data as Record<string, unknown>);
}

export async function getPublishedPostsByAuthorId(authorId: string): Promise<BlogPostWithAuthor[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .select(`*, author:team_members!author_id (${AUTHOR_SELECT})`)
    .eq("status", "published")
    .eq("author_id", authorId)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("getPublishedPostsByAuthorId:", error.message);
    return [];
  }
  return (data || []).map((row) => mapPostWithAuthor(row as Record<string, unknown>));
}

export async function getBlogAuthorById(authorId: string): Promise<BlogAuthor | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_members")
    .select(AUTHOR_SELECT)
    .eq("id", authorId)
    .maybeSingle();

  if (error || !data) return null;
  return mapAuthor(data as Record<string, unknown>);
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getAllBlogPosts:", error.message);
    return [];
  }
  return (data || []) as BlogPost[];
}

export async function getBlogPostSlugs(): Promise<string[]> {
  const posts = await getPublishedBlogPosts();
  return posts.map((p) => p.slug);
}

export const BLOG_STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
  rejected: "Needs revision",
};
