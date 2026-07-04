import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

/** Renders admin-authored blog body: paragraphs, ## headings, - bullets. */
export default function BlogBody({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/).filter(Boolean);

  return (
    <div className="space-y-5 text-[1.05rem] leading-[1.75] text-lux-text/90">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="font-bricolage font-bold text-2xl text-lux-text mt-10 mb-3">
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="font-bricolage font-bold text-xl text-lux-text mt-8 mb-2">
              {trimmed.slice(4)}
            </h3>
          );
        }
        if (trimmed.split("\n").every((line) => line.trim().startsWith("- "))) {
          const items = trimmed.split("\n").map((line) => line.trim().replace(/^- /, ""));
          return (
            <ul key={i} className="list-disc pl-6 space-y-2 text-lux-muted">
              {items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-lux-muted">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export function blogArticleJsonLd(post: {
  title: string;
  excerpt: string | null;
  slug: string;
  cover_image_url: string | null;
  published_at: string | null;
  updated_at: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at || post.updated_at,
    dateModified: post.updated_at,
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
    publisher: {
      "@type": "Organization",
      name: "InMailly",
      url: siteUrl,
    },
  };
}
