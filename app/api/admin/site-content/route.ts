import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";
import {
  DEFAULT_SITE_CONTENT,
  SITE_SECTIONS,
  type SiteSection,
} from "@/lib/site-content-defaults";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data } = await admin.from("site_content").select("section, data, updated_at");

  const sections: Record<string, unknown> = {};
  for (const key of SITE_SECTIONS) {
    sections[key] = DEFAULT_SITE_CONTENT[key];
  }
  for (const row of data || []) {
    if (row.section) sections[row.section] = row.data;
  }

  return NextResponse.json({ sections, defaults: DEFAULT_SITE_CONTENT });
}

export async function PATCH(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { section, data } = (await request.json()) as {
    section?: SiteSection;
    data?: unknown;
  };

  if (!section || !SITE_SECTIONS.includes(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("site_content").upsert({
    section,
    data,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
