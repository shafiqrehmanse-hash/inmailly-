import type { Metadata } from "next";
import Link from "next/link";
import BlogPostCard from "@/components/blog/BlogPostCard";
import LuxBackground from "@/components/home/LuxBackground";
import LuxFooter from "@/components/home/LuxFooter";
import LuxNav from "@/components/home/LuxNav";
import { getPublishedBlogPosts } from "@/lib/blog";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Blog — LinkedIn Outreach Tips & B2B Sales Insights",
  description:
    "Guides on LinkedIn InMail, B2B outreach, sales navigator targeting, and managed outreach for agencies and growth teams.",
  openGraph: {
    title: "InMailly Blog — LinkedIn Outreach & B2B Sales",
    description:
      "Guides on LinkedIn InMail, B2B outreach, sales navigator targeting, and managed outreach for agencies and growth teams.",
    url: `${getSiteUrl()}/blog`,
  },
  alternates: {
    canonical: `${getSiteUrl()}/blog`,
  },
};

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <div className="relative min-h-screen bg-lux-bg text-lux-text">
      <LuxBackground />
      <LuxNav />
      <main className="pt-32 pb-24 px-6 lg:px-10">
        <div className="max-w-[1100px] mx-auto">
          <Link href="/" className="text-sm text-lux-muted hover:text-lux-cyan mb-8 inline-block transition-colors">
            ← Home
          </Link>
          <div className="max-w-2xl mb-14">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-lux-cyan mb-3">InMailly Blog</p>
            <h1 className="font-bricolage font-extrabold text-[clamp(2.2rem,4.5vw,3.5rem)] tracking-tight text-lux-text mb-4">
              LinkedIn outreach insights
            </h1>
            <p className="text-lg text-lux-muted leading-relaxed">
              Practical guides on InMail, B2B prospecting, campaign transparency, and scaling outreach without
              enterprise pricing.
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="border border-white/[0.08] bg-lux-card/50 p-12 text-center">
              <p className="text-lux-muted">New articles coming soon. Check back shortly.</p>
            </div>
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
