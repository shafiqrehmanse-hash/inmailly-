import { createAdminClient } from "@/lib/supabase/admin";

export type BlogPostStatus = "draft" | "published";

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
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function getPublishedBlogPosts(limit?: number): Promise<BlogPost[]> {
  const admin = createAdminClient();
  let q = admin
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (limit) q = q.limit(limit);

  const { data, error } = await q;
  if (error) {
    console.error("getPublishedBlogPosts:", error.message);
    return [];
  }
  return (data || []) as BlogPost[];
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("getPublishedBlogPostBySlug:", error.message);
    return null;
  }
  return (data as BlogPost | null) ?? null;
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
