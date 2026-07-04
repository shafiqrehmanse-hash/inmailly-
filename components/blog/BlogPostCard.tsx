import Link from "next/link";
import type { BlogPost } from "@/lib/blog";
import { formatDate } from "@/lib/utils";

export default function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block border border-white/[0.08] bg-lux-card/60 backdrop-blur-sm hover:border-lux-cyan/30 hover:bg-lux-card/90 transition-all duration-300 overflow-hidden"
    >
      {post.cover_image_url ? (
        <div className="aspect-[16/9] overflow-hidden bg-lux-bg2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-lux-blue/20 via-lux-bg2 to-lux-purple/10 flex items-center justify-center">
          <span className="text-4xl opacity-40">✦</span>
        </div>
      )}
      <div className="p-6">
        <time className="text-[0.7rem] font-bold uppercase tracking-widest text-lux-cyan">
          {formatDate(post.published_at || post.created_at)}
        </time>
        <h2 className="font-bricolage font-bold text-xl text-lux-text mt-2 group-hover:text-lux-cyan transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm text-lux-muted mt-3 line-clamp-3 leading-relaxed">{post.excerpt}</p>
        )}
        <span className="inline-block mt-4 text-sm font-medium text-lux-cyan">Read article →</span>
      </div>
    </Link>
  );
}
