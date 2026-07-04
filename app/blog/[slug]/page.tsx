import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogBody, { blogArticleJsonLd } from "@/components/blog/BlogBody";
import LuxBackground from "@/components/home/LuxBackground";
import LuxFooter from "@/components/home/LuxFooter";
import LuxNav from "@/components/home/LuxNav";
import { getPublishedBlogPostBySlug, getPublishedBlogPosts } from "@/lib/blog";
import { getSiteUrl } from "@/lib/site-url";
import { formatDate } from "@/lib/utils";

type Props = { params: { slug: string } };

export async function generateStaticParams() {
  const posts = await getPublishedBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedBlogPostBySlug(params.slug);
  if (!post) return { title: "Post not found" };

  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || post.title;
  const url = `${getSiteUrl()}/blog/${post.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
    },
    alternates: { canonical: url },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPublishedBlogPostBySlug(params.slug);
  if (!post) notFound();

  const jsonLd = blogArticleJsonLd(post);

  return (
    <div className="relative min-h-screen bg-lux-bg text-lux-text">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LuxBackground />
      <LuxNav />
      <main className="pt-32 pb-24 px-6 lg:px-10">
        <article className="max-w-3xl mx-auto">
          <Link href="/blog" className="text-sm text-lux-muted hover:text-lux-cyan mb-8 inline-block transition-colors">
            ← All articles
          </Link>

          <header className="mb-10">
            <time className="text-[0.7rem] font-bold uppercase tracking-widest text-lux-cyan">
              {formatDate(post.published_at || post.created_at)}
            </time>
            <h1 className="font-bricolage font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight text-lux-text mt-3 mb-4">
              {post.title}
            </h1>
            {post.excerpt && <p className="text-lg text-lux-muted leading-relaxed">{post.excerpt}</p>}
          </header>

          {post.cover_image_url && (
            <div className="mb-10 border border-white/[0.08] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.cover_image_url} alt="" className="w-full h-auto" />
            </div>
          )}

          <BlogBody body={post.body} />

          <div className="mt-16 pt-10 border-t border-white/[0.08]">
            <p className="text-sm text-lux-muted mb-4">Ready to scale LinkedIn outreach without enterprise InMail costs?</p>
            <Link
              href="/client/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-lux-cyan text-lux-bg font-bold text-sm hover:bg-lux-cyan/90 transition-colors"
            >
              Get started with InMailly →
            </Link>
          </div>
        </article>
      </main>
      <LuxFooter />
    </div>
  );
}
