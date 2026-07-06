"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { slugifyTitle, type BlogPost } from "@/lib/blog";
import { BLOG_CATEGORIES, isValidBlogCategory } from "@/lib/blog-categories";

const EMPTY = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  cover_image_url: "",
  meta_title: "",
  meta_description: "",
  category: "",
};

function WriteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [postId, setPostId] = useState<string | null>(editId);
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<BlogPost["status"]>("draft");
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [autoSlug, setAutoSlug] = useState(true);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const readOnly = status === "pending_review" || status === "published";

  const loadPost = useCallback(async (id: string) => {
    setLoading(true);
    const res = await fetch(`/api/content/posts?id=${id}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not load article");
      return;
    }
    const post = data.post as BlogPost;
    setPostId(post.id);
    setStatus(post.status);
    setReviewNote(post.review_note);
    setAutoSlug(false);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      body: post.body,
      cover_image_url: post.cover_image_url || "",
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      category: post.category || "",
    });
  }, []);

  useEffect(() => {
    if (editId) loadPost(editId);
  }, [editId, loadPost]);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && autoSlug) next.slug = slugifyTitle(String(value));
      return next;
    });
  }

  async function saveDraft() {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/content/posts", {
      method: postId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: postId }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save draft");
      return;
    }
    const post = data.post as BlogPost;
    setPostId(post.id);
    setStatus(post.status);
    if (!editId) router.replace(`/content/write?id=${post.id}`);
  }

  async function submitForReview() {
    if (!postId) {
      setError("Save your draft first, then submit for review.");
      return;
    }
    if (!form.category || !isValidBlogCategory(form.category)) {
      setError("Choose a category before submitting.");
      return;
    }
    if (!form.body.trim()) {
      setError("Article body is required before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/content/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId, action: "submit_for_review", ...form }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Could not submit for review");
      return;
    }
    setStatus(data.post.status);
    router.push("/content/hub");
  }

  if (loading) return <p className="text-sm text-lux-muted">Loading article…</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/content/hub" className="text-sm text-lux-cyan hover:underline">
          ← My articles
        </Link>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text mt-3">
          {postId ? "Edit article" : "Write article"}
        </h1>
        <p className="text-sm text-lux-muted mt-1">
          Articles are reviewed by admin before publishing on the public blog.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {status === "rejected" && reviewNote && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl px-4 py-3 text-sm">
          <strong>Revision requested:</strong> {reviewNote}
        </div>
      )}

      {readOnly && (
        <div className="bg-lux-cyan/10 border border-lux-cyan/30 text-lux-cyan rounded-xl px-4 py-3 text-sm">
          {status === "pending_review"
            ? "This article is with admin for review — editing is locked until approved or sent back."
            : "This article is published. Contact admin for changes."}
        </div>
      )}

      <div className="lux-card-elite p-5 space-y-4">
        <label className="block">
          <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Title</span>
          <input
            className="lux-input rounded-xl mt-1"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            disabled={readOnly}
          />
        </label>

        <label className="block">
          <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">URL slug</span>
          <input
            className="lux-input rounded-xl mt-1 font-mono text-sm"
            value={form.slug}
            onChange={(e) => {
              setAutoSlug(false);
              updateField("slug", e.target.value);
            }}
            disabled={readOnly}
          />
        </label>

        <label className="block">
          <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Category</span>
          <select
            className="lux-input rounded-xl mt-1"
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
            disabled={readOnly}
          >
            <option value="">Select category…</option>
            {BLOG_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Excerpt</span>
          <textarea
            className="lux-input rounded-xl mt-1 min-h-[80px]"
            value={form.excerpt}
            onChange={(e) => updateField("excerpt", e.target.value)}
            disabled={readOnly}
            placeholder="Short summary for blog list and SEO…"
          />
        </label>

        <label className="block">
          <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Body</span>
          <p className="text-[0.65rem] text-lux-muted mt-0.5 mb-1">
            Blank lines = paragraphs. ## headings, - bullet lists.
          </p>
          <textarea
            className="lux-input rounded-xl mt-1 min-h-[300px] font-mono text-sm"
            value={form.body}
            onChange={(e) => updateField("body", e.target.value)}
            disabled={readOnly}
          />
        </label>

        <label className="block">
          <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Cover image URL</span>
          <input
            className="lux-input rounded-xl mt-1"
            value={form.cover_image_url}
            onChange={(e) => updateField("cover_image_url", e.target.value)}
            disabled={readOnly}
            placeholder="https://… (optional)"
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">SEO title</span>
            <input
              className="lux-input rounded-xl mt-1"
              value={form.meta_title}
              onChange={(e) => updateField("meta_title", e.target.value)}
              disabled={readOnly}
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">SEO description</span>
            <input
              className="lux-input rounded-xl mt-1"
              value={form.meta_description}
              onChange={(e) => updateField("meta_description", e.target.value)}
              disabled={readOnly}
            />
          </label>
        </div>

        {!readOnly && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={saveDraft} disabled={saving}>
              {saving ? "Saving…" : "Save draft"}
            </Button>
            <Button variant="lux-ghost" onClick={submitForReview} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit for review"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContentWritePage() {
  return (
    <Suspense>
      <WriteForm />
    </Suspense>
  );
}
