import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogPostCard from "@/components/blog/BlogPostCard";
import LuxBackground from "@/components/home/LuxBackground";
import LuxFooter from "@/components/home/LuxFooter";
import LuxNav from "@/components/home/LuxNav";
import TeamAvatar from "@/components/team/TeamAvatar";
import { getBlogAuthorById, getPublishedPostsByAuthorId } from "@/lib/blog";
import { getSiteUrl } from "@/lib/site-url";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = await getBlogAuthorById(params.id);
  if (!author) return { title: "Author not found" };

  return {
    title: `${author.name} — InMailly Blog`,
    description: author.author_bio || `Articles by ${author.name} on LinkedIn outreach and B2B sales.`,
    alternates: { canonical: `${getSiteUrl()}/blog/author/${author.id}` },
  };
}

export default async function BlogAuthorPage({ params }: Props) {
  const [author, posts] = await Promise.all([
    getBlogAuthorById(params.id),
    getPublishedPostsByAuthorId(params.id),
  ]);

  if (!author) notFound();

  return (
    <div className="relative min-h-screen bg-lux-bg text-lux-text">
      <LuxBackground />
      <LuxNav />
      <main className="pt-32 pb-24 px-6 lg:px-10">
        <div className="max-w-[1100px] mx-auto">
          <Link href="/blog" className="text-sm text-lux-muted hover:text-lux-cyan mb-8 inline-block transition-colors">
            ← All articles
          </Link>

          <div className="flex items-start gap-5 mb-12 p-6 border border-white/[0.08] bg-lux-card/40 max-w-2xl">
            <TeamAvatar name={author.name} photoUrl={author.photo_url} size="lg" />
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-cyan mb-1">Author</p>
              <h1 className="font-bricolage font-extrabold text-3xl text-lux-text">{author.name}</h1>
              {author.author_title && <p className="text-sm text-lux-muted mt-1">{author.author_title}</p>}
              {author.author_bio && (
                <p className="text-sm text-lux-muted mt-3 leading-relaxed">{author.author_bio}</p>
              )}
            </div>
          </div>

          <h2 className="font-bricolage font-bold text-xl text-lux-text mb-6">
            Articles by {author.name.split(" ")[0]}
          </h2>

          {posts.length === 0 ? (
            <p className="text-lux-muted">No published articles yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
      <LuxFooter />
    </div>
  );
}
