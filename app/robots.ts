import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/team", "/client", "/campaign", "/api", "/embed", "/login"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
