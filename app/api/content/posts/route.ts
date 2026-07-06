import { NextRequest, NextResponse } from "next/server";
import { slugifyTitle } from "@/lib/blog";
import { isValidBlogCategory } from "@/lib/blog-categories";
import { getContentManagerMember } from "@/lib/content-auth-server";
import { notifyAdminBlogPendingReview } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

function editableStatus(status: string) {
  return status === "draft" || status === "rejected";
}

export async function GET(request: NextRequest) {
  const member = await getContentManagerMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  const admin = createAdminClient();

  if (id) {
    const { data, error } = await admin
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .eq("author_id", member.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json({ post: data });
  }

  const { data, error } = await admin
    .from("blog_posts")
    .select("*")
    .eq("author_id", member.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data || [] });
}

export async function POST(request: NextRequest) {
  const member = await getContentManagerMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const slug = String(body.slug || slugifyTitle(title)).trim() || slugifyTitle(title);
  const category = body.category && isValidBlogCategory(body.category) ? body.category : null;
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
      status: "draft",
      author_id: member.id,
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
  const member = await getContentManagerMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "Post id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .eq("author_id", member.id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const now = new Date().toISOString();

  if (body.action === "submit_for_review") {
    if (!editableStatus(existing.status)) {
      return NextResponse.json({ error: "This article cannot be submitted right now" }, { status: 400 });
    }
  } else if (!editableStatus(existing.status)) {
    return NextResponse.json({ error: "This article is locked while under review or published" }, { status: 400 });
  }

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
    if (cat && !isValidBlogCategory(cat)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    patch.category = cat || null;
  }

  if (body.action === "submit_for_review") {
    const title = String(patch.title ?? existing.title).trim();
    const articleBody = String(patch.body ?? existing.body).trim();
    const category = (patch.category as string | null) ?? existing.category;
    if (!title || !articleBody) {
      return NextResponse.json({ error: "Title and body are required before submitting" }, { status: 400 });
    }
    if (!category || !isValidBlogCategory(category)) {
      return NextResponse.json({ error: "Category is required before submitting" }, { status: 400 });
    }
    patch.status = "pending_review";
    patch.submitted_at = now;
    patch.review_note = null;
    patch.reviewed_at = null;
  }

  const { data, error } = await admin.from("blog_posts").update(patch).eq("id", id).select().single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.action === "submit_for_review") {
    void notifyAdminBlogPendingReview({
      authorName: member.name,
      title: data.title,
      slug: data.slug,
      category: data.category,
    });
  }

  return NextResponse.json({ post: data });
}
