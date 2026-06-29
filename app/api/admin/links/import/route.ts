import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";
import { aiHint, parseLinksFromPaste, smartCategory, smartLabel } from "@/lib/links";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { paste, batchName } = await request.json();
  const parsed = parseLinksFromPaste(paste || "");
  const admin = createAdminClient();
  const keys = parsed.map((p) => p.key);
  const { data: existing } = await admin
    .from("outreach_links")
    .select("url_key")
    .in("url_key", keys.length ? keys : ["__none__"]);
  const existingSet = new Set((existing || []).map((e) => e.url_key));
  const toInsert = parsed.filter((p) => !existingSet.has(p.key));
  if (toInsert.length === 0) {
    return NextResponse.json({ inserted: 0, duplicates: parsed.length });
  }
  const rows = toInsert.map((p) => {
    const cat = smartCategory(p.url);
    return {
      url: p.url,
      url_key: p.key,
      smart_label: smartLabel(p.url),
      category: cat,
      batch_name: batchName || null,
      ai_hint: aiHint(cat),
      status: "available",
    };
  });
  const { error } = await admin.from("outreach_links").insert(rows);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    inserted: toInsert.length,
    duplicates: parsed.length - toInsert.length,
  });
}
