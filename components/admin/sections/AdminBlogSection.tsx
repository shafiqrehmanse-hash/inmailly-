"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { BLOG_STATUS_LABELS, slugifyTitle, type BlogPost, type BlogPostStatus } from "@/lib/blog";
import { BLOG_CATEGORIES, blogCategoryLabel } from "@/lib/blog-categories";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";
import { formatDate } from "@/lib/utils";

type AdminBlogPost = BlogPost & {
  author?: { id: string; name: string; photo_url?: string | null; author_title?: string | null } | null;
};

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  cover_image_url: "",
  meta_title: "",
  meta_description: "",
  category: "",
  status: "draft" as BlogPostStatus,
};

function statusTone(status: BlogPostStatus) {
  if (status === "published") return "bg-emerald-500/15 text-emerald-400";
  if (status === "pending_review") return "bg-amber-500/15 text-amber-300";
  if (status === "rejected") return "bg-red-500/15 text-red-300";
  return "bg-zinc-500/15 text-zinc-400";
}

export default function AdminBlogSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [autoSlug, setAutoSlug] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [rejectNote, setRejectNote] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = filter === "pending" ? "&filter=pending" : "";
    const res = await fetch(`/api/admin/blog?key=${adminKey}${qs}`);
    const data = await res.json();
    if (res.ok) setPosts(data.posts || []);
    setLoading(false);
  }, [adminKey, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingCount = posts.filter((p) => p.status === "pending_review").length;

  function startNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setAutoSlug(true);
    setRejectingId(null);
    setRejectNote("");
  }

  function startEdit(post: AdminBlogPost) {
    setEditingId(post.id);
    setAutoSlug(false);
    setRejectingId(null);
    setRejectNote("");
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      body: post.body,
      cover_image_url: post.cover_image_url || "",
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      category: post.category || "",
      status: post.status,
    });
  }

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && autoSlug) {
        next.slug = slugifyTitle(String(value));
      }
      return next;
    });
  }

  async function save() {
    if (!form.title.trim()) {
      showToast("Title is required", "error");
      return;
    }
    setSaving(true);
    const payload = { ...form, id: editingId };
    const res = await fetch(`/api/admin/blog?key=${adminKey}`, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      showToast(data.error || "Could not save post", "error");
      return;
    }
    showToast(editingId ? "Post updated" : "Post created");
    startNew();
    load();
  }

  async function setPostStatus(id: string, status: BlogPostStatus, reviewNote?: string) {
    const res = await fetch(`/api/admin/blog?key=${adminKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ id, status, review_note: reviewNote }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Could not update status", "error");
      return;
    }
    showToast(status === "published" ? "Published" : status === "rejected" ? "Sent back for revision" : "Updated");
    setRejectingId(null);
    setRejectNote("");
    if (editingId === id) startEdit(data.post);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this post permanently?")) return;
    const res = await fetch(`/api/admin/blog?key=${adminKey}&id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": adminKey },
    });
    if (!res.ok) {
      const data = await res.json();
      showToast(data.error || "Could not delete", "error");
      return;
    }
    showToast("Post deleted");
    if (editingId === id) startNew();
    load();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-bricolage font-bold text-xl text-lux-text">Blog posts</h2>
          <p className="text-sm text-lux-muted mt-1">
            Content managers submit articles for your approval. Published posts appear at{" "}
            <a href="/blog" target="_blank" rel="noreferrer" className="text-lux-cyan hover:underline">
              /blog
            </a>
            .
          </p>
        </div>
        <Button variant="lux-ghost" size="sm" onClick={startNew}>
          + New post
        </Button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border ${
            filter === "all"
              ? "border-lux-cyan/40 bg-lux-cyan/10 text-lux-cyan"
              : "border-white/10 text-lux-muted"
          }`}
        >
          All posts
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border ${
            filter === "pending"
              ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
              : "border-white/10 text-lux-muted"
          }`}
        >
          Pending review{filter !== "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
        </button>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="lux-card-elite p-5 space-y-4">
          <p className="admin-section-title">{editingId ? "Edit post" : "New post"}</p>

          <div className="space-y-3">
            <label className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Title</span>
              <input
                className="lux-input rounded-xl mt-1"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
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
              />
            </label>

            <label className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Category</span>
              <select
                className="lux-input rounded-xl mt-1"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
              >
                <option value="">No category</option>
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
              />
            </label>

            <label className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Body</span>
              <textarea
                className="lux-input rounded-xl mt-1 min-h-[280px] font-mono text-sm"
                value={form.body}
                onChange={(e) => updateField("body", e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Cover image URL</span>
              <input
                className="lux-input rounded-xl mt-1"
                value={form.cover_image_url}
                onChange={(e) => updateField("cover_image_url", e.target.value)}
              />
            </label>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">SEO title</span>
                <input
                  className="lux-input rounded-xl mt-1"
                  value={form.meta_title}
                  onChange={(e) => updateField("meta_title", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Status</span>
                <select
                  className="lux-input rounded-xl mt-1"
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value as BlogPostStatus)}
                >
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending review</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">SEO description</span>
              <textarea
                className="lux-input rounded-xl mt-1 min-h-[72px]"
                value={form.meta_description}
                onChange={(e) => updateField("meta_description", e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update post" : "Create post"}
            </Button>
            {editingId && (
              <Button variant="lux-ghost" onClick={startNew}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="lux-card p-5">
          <p className="admin-section-title mb-4">
            {filter === "pending" ? "Pending review" : "All posts"}
          </p>
          {loading ? (
            <p className="text-sm text-lux-muted">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-lux-muted">
              {filter === "pending" ? "No articles waiting for approval." : "No posts yet."}
            </p>
          ) : (
            <ul className="space-y-3">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="p-3 border border-white/[0.06] bg-white/[0.02] space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-lux-text truncate">{post.title}</p>
                      <p className="text-xs text-lux-muted mt-0.5">
                        /blog/{post.slug} · {formatDate(post.updated_at)}
                        {post.author?.name ? ` · ${post.author.name}` : ""}
                        {post.category ? ` · ${blogCategoryLabel(post.category)}` : ""}
                      </p>
                      <span
                        className={`inline-block mt-1.5 text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 ${statusTone(post.status)}`}
                      >
                        {BLOG_STATUS_LABELS[post.status]}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button type="button" onClick={() => startEdit(post)} className="text-xs text-lux-cyan hover:underline">
                        Edit
                      </button>
                      {post.status === "published" && (
                        <Link href={`/blog/${post.slug}`} target="_blank" className="text-xs text-lux-muted hover:text-lux-cyan">
                          View
                        </Link>
                      )}
                      <button type="button" onClick={() => remove(post.id)} className="text-xs text-red-400 hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>

                  {post.status === "pending_review" && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" onClick={() => setPostStatus(post.id, "published")}>
                        Approve & publish
                      </Button>
                      {rejectingId === post.id ? (
                        <div className="w-full space-y-2 mt-2">
                          <input
                            className="lux-input rounded-lg text-sm"
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="Revision note for the author…"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="lux-ghost"
                              onClick={() => setPostStatus(post.id, "rejected", rejectNote)}
                            >
                              Send back
                            </Button>
                            <button
                              type="button"
                              className="text-xs text-lux-muted"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectNote("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="lux-ghost" onClick={() => setRejectingId(post.id)}>
                          Request revision
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
