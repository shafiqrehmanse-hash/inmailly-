import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_SITE_CONTENT,
  mergeSiteContent,
  type SiteContent,
  type SiteSection,
} from "@/lib/site-content-defaults";

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("site_content").select("section, data");
    if (!data?.length) return DEFAULT_SITE_CONTENT;

    const stored: Partial<Record<SiteSection, unknown>> = {};
    for (const row of data) {
      if (row.section && row.data) {
        stored[row.section as SiteSection] = row.data;
      }
    }
    return mergeSiteContent(stored);
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export async function getSiteSection<K extends SiteSection>(
  section: K
): Promise<SiteContent[K]> {
  const all = await getSiteContent();
  return all[section];
}
