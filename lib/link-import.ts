import type { createAdminClient } from "@/lib/supabase/admin";
import { extractUrlsFromLine, parseLinksFromPaste } from "@/lib/links";

type AdminClient = ReturnType<typeof createAdminClient>;

const KEY_CHUNK = 80;
const INSERT_CHUNK = 200;

/** Fetch existing url_keys in chunks so large pastes don't hit PostgREST limits. */
export async function fetchExistingUrlKeys(
  admin: AdminClient,
  keys: string[]
): Promise<Set<string>> {
  const existing = new Set<string>();
  if (keys.length === 0) return existing;

  for (let i = 0; i < keys.length; i += KEY_CHUNK) {
    const chunk = keys.slice(i, i + KEY_CHUNK);
    const { data, error } = await admin
      .from("outreach_links")
      .select("url_key")
      .in("url_key", chunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of data || []) {
      existing.add(row.url_key);
    }
  }

  return existing;
}

export type LinkImportPreview = {
  parsed: number;
  new: number;
  duplicates: number;
  invalid: number;
  totalLines: number;
};

export async function previewLinkImport(
  admin: AdminClient,
  paste: string
): Promise<LinkImportPreview> {
  const parsed = parseLinksFromPaste(paste || "");
  const keys = parsed.map((p) => p.key);
  const existingSet = await fetchExistingUrlKeys(admin, keys);
  const newCount = parsed.filter((p) => !existingSet.has(p.key)).length;
  const lines = (paste || "").split(/\r?\n/);
  let invalid = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    if (extractUrlsFromLine(line).length === 0) invalid++;
  }

  return {
    parsed: parsed.length,
    new: newCount,
    duplicates: parsed.length - newCount,
    invalid,
    totalLines: lines.filter((l) => l.trim()).length,
  };
}

export async function importLinksFromPaste(
  admin: AdminClient,
  paste: string,
  batchName?: string | null
) {
  const parsed = parseLinksFromPaste(paste || "");
  const keys = parsed.map((p) => p.key);
  const existingSet = await fetchExistingUrlKeys(admin, keys);
  const toInsert = parsed.filter((p) => !existingSet.has(p.key));

  if (toInsert.length === 0) {
    return {
      inserted: 0,
      duplicates: parsed.length,
      invalid: previewInvalidLineCount(paste),
      parsed: parsed.length,
    };
  }

  const { aiHint, smartCategory, smartLabel } = await import("@/lib/links");

  const rows = toInsert.map((p) => {
    const cat = smartCategory(p.url);
    return {
      url: p.url,
      url_key: p.key,
      smart_label: smartLabel(p.url),
      category: cat,
      batch_name: batchName || null,
      ai_hint: aiHint(cat),
      status: "available" as const,
    };
  });

  let inserted = 0;
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const chunk = rows.slice(i, i + INSERT_CHUNK);
    const { error } = await admin.from("outreach_links").insert(chunk);
    if (error) {
      throw new Error(error.message);
    }
    inserted += chunk.length;
  }

  return {
    inserted,
    duplicates: parsed.length - inserted,
    invalid: previewInvalidLineCount(paste),
    parsed: parsed.length,
  };
}

function previewInvalidLineCount(paste: string): number {
  const lines = (paste || "").split(/\r?\n/);
  let invalid = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    if (extractUrlsFromLine(line).length === 0) invalid++;
  }
  return invalid;
}
