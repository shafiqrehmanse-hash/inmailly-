import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";
import { parseLinksFromPaste } from "@/lib/links";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { paste } = await request.json();
  const parsed = parseLinksFromPaste(paste || "");
  const admin = createAdminClient();
  const keys = parsed.map((p) => p.key);
  const { data: existing } = await admin
    .from("outreach_links")
    .select("url_key")
    .in("url_key", keys.length ? keys : ["__none__"]);
  const existingSet = new Set((existing || []).map((e) => e.url_key));
  const lines = (paste || "").split(/\r?\n/);
  let invalid = 0;
  for (const line of lines) {
    if (line.trim() && !line.match(/https?:\/\//i)) invalid++;
  }
  const newCount = parsed.filter((p) => !existingSet.has(p.key)).length;
  const dupCount = parsed.length - newCount;
  return NextResponse.json({ new: newCount, duplicates: dupCount, invalid, total: parsed.length });
}
