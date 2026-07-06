import Link from "next/link";
import TeamAvatar from "@/components/team/TeamAvatar";
import type { BlogAuthor } from "@/lib/blog";

export default function BlogAuthorCard({ author }: { author: BlogAuthor }) {
  return (
    <div className="flex items-start gap-4 p-5 border border-white/[0.08] bg-lux-card/40">
      <TeamAvatar name={author.name} photoUrl={author.photo_url} size="lg" />
      <div className="min-w-0">
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-cyan mb-1">Written by</p>
        <Link
          href={`/blog/author/${author.id}`}
          className="font-bricolage font-bold text-lg text-lux-text hover:text-lux-cyan transition-colors"
        >
          {author.name}
        </Link>
        {author.author_title && <p className="text-sm text-lux-muted mt-0.5">{author.author_title}</p>}
        {author.author_bio && (
          <p className="text-sm text-lux-muted mt-2 leading-relaxed line-clamp-3">{author.author_bio}</p>
        )}
        <Link href={`/blog/author/${author.id}`} className="inline-block mt-3 text-sm text-lux-cyan hover:underline">
          More from {author.name.split(" ")[0]} →
        </Link>
      </div>
    </div>
  );
}
