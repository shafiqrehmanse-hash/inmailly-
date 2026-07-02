import type { createAdminClient } from "@/lib/supabase/admin";
import { countRawUrlsInPaste, extractUrlsFromLine, parseLinksFromPaste } from "@/lib/links";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Keep small — long base64 url_keys blow up GET query strings for .in() filters. */
const KEY_CHUNK = 15;
const INSERT_CHUNK = 100;

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
      .in("url_key", chunk)
      .limit(chunk.length);

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
  duplicateInPaste: number;
  duplicateInDb: number;
  invalid: number;
  totalLines: number;
  rawUrlTokens: number;
};

export async function previewLinkImport(
  admin: AdminClient,
  paste: string
): Promise<LinkImportPreview> {
  const parsed = parseLinksFromPaste(paste || "");
  const keys = parsed.map((p) => p.key);
  const existingSet = await fetchExistingUrlKeys(admin, keys);
  const newCount = parsed.filter((p) => !existingSet.has(p.key)).length;
  const duplicateInDb = parsed.filter((p) => existingSet.has(p.key)).length;
  const rawUrlTokens = countRawUrlsInPaste(paste || "");
  const duplicateInPaste = Math.max(0, rawUrlTokens - parsed.length);

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
    duplicateInPaste,
    duplicateInDb,
    invalid,
    totalLines: lines.filter((l) => l.trim()).length,
    rawUrlTokens,
  };
}

export type LinkImportResult = {
  inserted: number;
  parsed: number;
  duplicates: number;
  duplicateInPaste: number;
  duplicateInDb: number;
  invalid: number;
  rawUrlTokens: number;
};

export async function importLinksFromPaste(
  admin: AdminClient,
  paste: string,
  batchName?: string | null
): Promise<LinkImportResult> {
  const parsed = parseLinksFromPaste(paste || "");
  const keys = parsed.map((p) => p.key);
  const existingSet = await fetchExistingUrlKeys(admin, keys);
  const toInsert = parsed.filter((p) => !existingSet.has(p.key));
  const duplicateInDb = parsed.length - toInsert.length;
  const rawUrlTokens = countRawUrlsInPaste(paste || "");
  const duplicateInPaste = Math.max(0, rawUrlTokens - parsed.length);
  const invalid = previewInvalidLineCount(paste);

  if (toInsert.length === 0) {
    return {
      inserted: 0,
      parsed: parsed.length,
      duplicates: parsed.length,
      duplicateInPaste,
      duplicateInDb,
      invalid,
      rawUrlTokens,
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
    const { data, error } = await admin
      .from("outreach_links")
      .upsert(chunk, { onConflict: "url_key", ignoreDuplicates: true })
      .select("id");

    if (error) {
      throw new Error(error.message);
    }

    inserted += data?.length ?? 0;
  }

  return {
    inserted,
    parsed: parsed.length,
    duplicates: parsed.length - inserted,
    duplicateInPaste,
    duplicateInDb,
    invalid,
    rawUrlTokens,
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
