import { NextRequest, NextResponse } from "next/server";
import { slugifyTitle, type BlogPostStatus } from "@/lib/blog";
import { isValidBlogCategory } from "@/lib/blog-categories";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

const VALID_STATUSES: BlogPostStatus[] = ["draft", "pending_review", "published", "rejected"];

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filter = request.nextUrl.searchParams.get("filter");
  const admin = createAdminClient();
  let q = admin
    .from("blog_posts")
    .select("*, author:team_members!author_id(id, name, photo_url, author_title)")
    .order("updated_at", { ascending: false });

  if (filter === "pending") q = q.eq("status", "pending_review");

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data || [] });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const slug = String(body.slug || slugifyTitle(title)).trim() || slugifyTitle(title);
  const status: BlogPostStatus =
    body.status === "published"
      ? "published"
      : body.status === "pending_review"
        ? "pending_review"
        : "draft";
  const category =
    body.category && isValidBlogCategory(body.category) ? body.category : body.category?.trim() || null;
  const now = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .insert({
      title,
      slug,
      excerpt: body.excerpt?.trim() || null,
      body: String(body.body || ""),
      cover_image_url: body.cover_image_url?.trim() || null,
      meta_title: body.meta_title?.trim() || null,
      meta_description: body.meta_description?.trim() || null,
      category,
      status,
      published_at: status === "published" ? body.published_at || now : null,
      reviewed_at: status === "published" ? now : null,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Slug already exists — choose a different one" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}

export async function PATCH(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "Post id required" }, { status: 400 });

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  if (body.title !== undefined) patch.title = String(body.title).trim();
  if (body.slug !== undefined) patch.slug = String(body.slug).trim();
  if (body.excerpt !== undefined) patch.excerpt = body.excerpt?.trim() || null;
  if (body.body !== undefined) patch.body = String(body.body);
  if (body.cover_image_url !== undefined) patch.cover_image_url = body.cover_image_url?.trim() || null;
  if (body.meta_title !== undefined) patch.meta_title = body.meta_title?.trim() || null;
  if (body.meta_description !== undefined) patch.meta_description = body.meta_description?.trim() || null;
  if (body.category !== undefined) {
    const cat = String(body.category || "");
    patch.category = cat && isValidBlogCategory(cat) ? cat : cat || null;
  }

  if (body.status !== undefined) {
    const status = VALID_STATUSES.includes(body.status) ? body.status : "draft";
    patch.status = status;

    if (status === "published") {
      const admin = createAdminClient();
      const { data: existing } = await admin.from("blog_posts").select("published_at").eq("id", id).single();
      if (!existing?.published_at) patch.published_at = now;
      patch.reviewed_at = now;
      patch.review_note = null;
    } else if (status === "rejected") {
      patch.reviewed_at = now;
      patch.review_note = body.review_note?.trim() || null;
    } else if (status === "draft") {
      patch.published_at = null;
    }
  } else if (body.review_note !== undefined) {
    patch.review_note = body.review_note?.trim() || null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("blog_posts").update(patch).eq("id", id).select().single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}

export async function DELETE(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Post id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("blog_posts").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
