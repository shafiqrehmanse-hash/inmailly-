export const BLOG_CATEGORIES = [
  { slug: "linkedin-outreach", label: "LinkedIn outreach" },
  { slug: "b2b-sales", label: "B2B sales" },
  { slug: "agency-white-label", label: "Agency & white-label" },
  { slug: "sales-navigator", label: "Sales Navigator tips" },
  { slug: "product-updates", label: "Product / InMailly updates" },
  { slug: "lead-generation", label: "Lead generation" },
  { slug: "managed-outreach", label: "Managed outreach" },
  { slug: "team-hiring", label: "Team & SDR hiring" },
] as const;

export type BlogCategorySlug = (typeof BLOG_CATEGORIES)[number]["slug"];

const LABEL_BY_SLUG = Object.fromEntries(BLOG_CATEGORIES.map((c) => [c.slug, c.label])) as Record<
  string,
  string
>;

export function blogCategoryLabel(slug: string | null | undefined): string {
  if (!slug) return "Insights";
  return LABEL_BY_SLUG[slug] || slug.replace(/-/g, " ");
}

export function isValidBlogCategory(slug: string): slug is BlogCategorySlug {
  return BLOG_CATEGORIES.some((c) => c.slug === slug);
}
