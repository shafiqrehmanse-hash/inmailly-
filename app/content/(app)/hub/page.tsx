"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { BLOG_STATUS_LABELS, type BlogPost } from "@/lib/blog";
import { blogCategoryLabel } from "@/lib/blog-categories";
import { formatDate } from "@/lib/utils";

function statusTone(status: BlogPost["status"]) {
  if (status === "published") return "bg-emerald-500/15 text-emerald-400";
  if (status === "pending_review") return "bg-amber-500/15 text-amber-300";
  if (status === "rejected") return "bg-red-500/15 text-red-300";
  return "bg-zinc-500/15 text-zinc-400";
}

export default function ContentHubPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/content/posts");
    const data = await res.json();
    if (res.ok) setPosts(data.posts || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">My articles</h1>
          <p className="text-sm text-lux-muted mt-1">
            Draft articles, submit for admin review, then they go live on{" "}
            <a href="/blog" target="_blank" rel="noreferrer" className="text-lux-cyan hover:underline">
              /blog
            </a>
            .
          </p>
        </div>
        <Link href="/content/write">
          <Button>+ Write article</Button>
        </Link>
      </div>

      <div className="lux-card p-5">
        {loading ? (
          <p className="text-sm text-lux-muted">Loading…</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lux-muted mb-4">No articles yet — start your first draft.</p>
            <Link href="/content/write">
              <Button>Write article</Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li
                key={post.id}
                className="flex flex-wrap items-start justify-between gap-3 p-4 border border-white/[0.06] bg-white/[0.02]"
              >
                <div className="min-w-0">
                  <p className="font-medium text-lux-text">{post.title}</p>
                  <p className="text-xs text-lux-muted mt-0.5">
                    Updated {formatDate(post.updated_at)}
                    {post.category ? ` · ${blogCategoryLabel(post.category)}` : ""}
                  </p>
                  <span
                    className={`inline-block mt-2 text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 ${statusTone(post.status)}`}
                  >
                    {BLOG_STATUS_LABELS[post.status]}
                  </span>
                  {post.status === "rejected" && post.review_note && (
                    <p className="text-xs text-red-300/90 mt-2 max-w-xl">
                      Admin note: {post.review_note}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {(post.status === "draft" || post.status === "rejected") && (
                    <Link href={`/content/write?id=${post.id}`} className="text-xs text-lux-cyan hover:underline">
                      Edit
                    </Link>
                  )}
                  {post.status === "pending_review" && (
                    <span className="text-xs text-amber-300/80">Awaiting approval</span>
                  )}
                  {post.status === "published" && (
                    <Link href={`/blog/${post.slug}`} target="_blank" className="text-xs text-lux-muted hover:text-lux-cyan">
                      View live
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
