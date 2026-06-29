export type HeroContent = {
  badge: string;
  titleLine1: string;
  titleLine2: string;
  titleAccent: string;
  subtitle: string;
  trustItems: string[];
  ctaPrimary: string;
  ctaSecondary: string;
};

export type StatItem = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  decimals: number;
};

export type StatsContent = {
  sectionLabel: string;
  items: StatItem[];
  ticker: string[];
};

export type PricingPlan = {
  name: string;
  price: string;
  unit: string;
  per: string;
  featured: boolean;
  trial?: boolean;
};

export type PricingContent = {
  sectionLabel: string;
  title: string;
  subtitle: string;
  plans: PricingPlan[];
};

export type FaqItem = { q: string; a: string };

export type FaqContent = {
  sectionLabel: string;
  title: string;
  items: FaqItem[];
};

export type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
};

export type TestimonialsContent = {
  sectionLabel: string;
  items: TestimonialItem[];
};

export type FinalCtaContent = {
  title: string;
  subtitle: string;
  cta: string;
};

export type ContactContent = {
  headline: string;
  subline: string;
};

export type SiteContent = {
  hero: HeroContent;
  stats: StatsContent;
  pricing: PricingContent;
  faq: FaqContent;
  testimonials: TestimonialsContent;
  finalCta: FinalCtaContent;
  contact: ContactContent;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    badge: "Managed LinkedIn outreach · Real dashboards",
    titleLine1: "Outreach",
    titleLine2: "infrastructure",
    titleAccent: "at scale.",
    subtitle:
      "Send us your target audience and InMail script. We deliver on verified, established LinkedIn profiles with Sales Navigator — powered by our internal software.",
    trustItems: [
      "Verified LinkedIn accounts",
      "Sales Nav activated",
      "Live client dashboard",
      "You provide audience + script",
    ],
    ctaPrimary: "Create account",
    ctaSecondary: "Book a call",
  },
  stats: {
    sectionLabel: "By the numbers",
    items: [
      { value: 2847000, suffix: "+", label: "Messages delivered", decimals: 0 },
      { value: 11.4, suffix: "%", label: "Average reply rate", decimals: 1 },
      { value: 0.27, prefix: "$", label: "Cost per message", decimals: 2 },
      { value: 48, suffix: "h", label: "Average launch time", decimals: 0 },
    ],
    ticker: [
      "Campaign #2847 · 142 replies today",
      "Acme Corp · 1,000 sends complete",
      "Series A SaaS · 11.2% reply rate",
      "Agency batch · 5,000 profiles queued",
      "Enterprise · 48h launch confirmed",
    ],
  },
  pricing: {
    sectionLabel: "Pricing",
    title: "Simple pricing. Serious outreach.",
    subtitle:
      "Verified Sales Nav profiles. You provide audience + script. We handle delivery and your dashboard tracks every reply.",
    plans: [
      {
        name: "Starter",
        price: "275",
        unit: "1,000 messages",
        per: "$0.27/msg",
        featured: true,
      },
      {
        name: "Growth",
        price: "1,100",
        unit: "5,000 messages",
        per: "$0.22/msg",
        featured: false,
      },
      {
        name: "Scale",
        price: "3,800",
        unit: "20,000 messages",
        per: "$0.19/msg",
        featured: false,
      },
      {
        name: "Enterprise",
        price: "Custom",
        unit: "Volume pricing",
        per: "Dedicated ops + SLA",
        featured: false,
      },
    ],
  },
  faq: {
    sectionLabel: "FAQ",
    title: "Questions, answered.",
    items: [
      {
        q: "How do I get started?",
        a: "Create a client account to preview your dashboard, then book a call. Share your target audience and InMail script — we launch your campaign on verified LinkedIn profiles with Sales Navigator.",
      },
      {
        q: "What LinkedIn accounts do you use?",
        a: "Verified, established LinkedIn profiles with Sales Navigator activated. Not your personal account — our infrastructure, operated by humans using our internal software.",
      },
      {
        q: "What do I need to provide?",
        a: "Two things: your target audience (profile list or ICP criteria) and your InMail script. We handle delivery, tracking, and reporting.",
      },
      {
        q: "How is this different from Sales Navigator?",
        a: "Sales Navigator costs $100/month for 50 InMail credits — that's $2 per message from your own account. We deliver at $0.27/InMail on verified profiles with a full client dashboard.",
      },
      {
        q: "Can I see replies in real time?",
        a: "Yes. Your client dashboard shows live responses, pipeline stages, and campaign analytics — the same interface you preview when you create an account.",
      },
    ],
  },
  testimonials: {
    sectionLabel: "What operators say",
    items: [
      {
        quote:
          "We burned $3,000/month on LinkedIn Ads for 40 replies. InMailly sent 5,000 messages and we got 380 conversations. The math is absurd.",
        name: "Amir K.",
        role: "Founder",
        company: "B2B SaaS",
        initials: "AK",
      },
      {
        quote:
          "This isn't another automation tool. Real humans, no restrictions, no bans. My pipeline went from dry to full in three weeks.",
        name: "Sofia R.",
        role: "VP Sales",
        company: "Enterprise Tech",
        initials: "SR",
      },
      {
        quote:
          "Clean operations layer. Every reply logged in real time. It feels like having ten SDRs without the payroll.",
        name: "Marcus W.",
        role: "Growth Lead",
        company: "Series A",
        initials: "MW",
      },
    ],
  },
  finalCta: {
    title: "Your next thousand conversations start here.",
    subtitle: "Create your dashboard account or book a launch call.",
    cta: "Create account",
  },
  contact: {
    headline: "Start your campaign",
    subline: "Tell us about your outreach goals. We respond within 24 hours.",
  },
};

export const SITE_SECTIONS = [
  "hero",
  "stats",
  "pricing",
  "faq",
  "testimonials",
  "finalCta",
  "contact",
] as const;

export type SiteSection = (typeof SITE_SECTIONS)[number];

export function mergeSiteContent(
  stored: Partial<Record<SiteSection, unknown>>
): SiteContent {
  const out = { ...DEFAULT_SITE_CONTENT };
  for (const key of SITE_SECTIONS) {
    const patch = stored[key];
    if (patch && typeof patch === "object") {
      (out as Record<string, unknown>)[key] = {
        ...out[key],
        ...(patch as Record<string, unknown>),
      };
    }
  }
  return out;
}
