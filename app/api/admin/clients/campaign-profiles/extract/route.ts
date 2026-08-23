import { NextRequest, NextResponse } from "next/server";
import { extractLinkedInProfileFromScreenshot } from "@/lib/linkedin-profile-screenshot";
import { verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

/** Preview extraction without saving — admin can review before adding. */
export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const imageDataUrl = String(body.imageDataUrl || "").trim();
  if (!imageDataUrl) {
    return NextResponse.json({ error: "imageDataUrl is required" }, { status: 400 });
  }

  try {
    const extracted = await extractLinkedInProfileFromScreenshot(imageDataUrl);
    return NextResponse.json({ success: true, extracted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
