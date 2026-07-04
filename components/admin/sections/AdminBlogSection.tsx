"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { slugifyTitle, type BlogPost } from "@/lib/blog";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";
import { formatDate } from "@/lib/utils";

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  cover_image_url: "",
  meta_title: "",
  meta_description: "",
  status: "draft" as "draft" | "published",
};

export default function AdminBlogSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [autoSlug, setAutoSlug] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/blog?key=${adminKey}`);
    const data = await res.json();
    if (res.ok) setPosts(data.posts || []);
    setLoading(false);
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  function startNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setAutoSlug(true);
  }

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setAutoSlug(false);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      body: post.body,
      cover_image_url: post.cover_image_url || "",
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
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
    const payload = {
      ...form,
      id: editingId,
    };
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
            Published posts appear at{" "}
            <a href="/blog" target="_blank" rel="noreferrer" className="text-lux-cyan hover:underline">
              /blog
            </a>{" "}
            and in your sitemap for Google Search Console.
          </p>
        </div>
        <Button variant="lux-ghost" size="sm" onClick={startNew}>
          + New post
        </Button>
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
                placeholder="LinkedIn InMail cost vs managed outreach"
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
                placeholder="linkedin-inmail-cost-vs-managed-outreach"
              />
            </label>

            <label className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Excerpt</span>
              <textarea
                className="lux-input rounded-xl mt-1 min-h-[80px]"
                value={form.excerpt}
                onChange={(e) => updateField("excerpt", e.target.value)}
                placeholder="Short summary for blog list and SEO fallback…"
              />
            </label>

            <label className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Body</span>
              <p className="text-[0.65rem] text-lux-muted mt-0.5 mb-1">
                Use blank lines for paragraphs. Start lines with ## or ### for headings, - for bullet lists.
              </p>
              <textarea
                className="lux-input rounded-xl mt-1 min-h-[280px] font-mono text-sm"
                value={form.body}
                onChange={(e) => updateField("body", e.target.value)}
                placeholder={"Opening paragraph here.\n\n## Section heading\n\nMore content…\n\n- Bullet one\n- Bullet two"}
              />
            </label>

            <label className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Cover image URL</span>
              <input
                className="lux-input rounded-xl mt-1"
                value={form.cover_image_url}
                onChange={(e) => updateField("cover_image_url", e.target.value)}
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
                  placeholder="Optional — defaults to title"
                />
              </label>
              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Status</span>
                <select
                  className="lux-input rounded-xl mt-1"
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value as "draft" | "published")}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">SEO description</span>
              <textarea
                className="lux-input rounded-xl mt-1 min-h-[72px]"
                value={form.meta_description}
                onChange={(e) => updateField("meta_description", e.target.value)}
                placeholder="155 characters for Google — optional"
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
          <p className="admin-section-title mb-4">All posts</p>
          {loading ? (
            <p className="text-sm text-lux-muted">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-lux-muted">No posts yet — create your first article.</p>
          ) : (
            <ul className="space-y-3">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="flex items-start justify-between gap-3 p-3 border border-white/[0.06] bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-lux-text truncate">{post.title}</p>
                    <p className="text-xs text-lux-muted mt-0.5">
                      /blog/{post.slug} · {formatDate(post.updated_at)}
                    </p>
                    <span
                      className={`inline-block mt-1.5 text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 ${
                        post.status === "published"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-zinc-500/15 text-zinc-400"
                      }`}
                    >
                      {post.status}
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
