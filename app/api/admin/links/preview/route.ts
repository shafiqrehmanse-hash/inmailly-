import { NextRequest, NextResponse } from "next/server";
import { previewLinkImport } from "@/lib/link-import";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paste, mode } = await request.json();
  const importMode = mode === "named" ? "named" : "urls";
  const admin = createAdminClient();

  try {
    const preview = await previewLinkImport(admin, paste || "", importMode);
    return NextResponse.json(preview);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
