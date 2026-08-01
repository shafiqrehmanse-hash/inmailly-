import { NextRequest, NextResponse } from "next/server";
import { INFO_DOC_BUCKET } from "@/lib/info-doc";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const status = body.status === "reviewed" ? "reviewed" : null;
  if (!status) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("employee_info_docs")
    .update({
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("status", "submitted")
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Doc not found or not submitted" }, { status: 404 });
  }

  return NextResponse.json({ doc: data });
}

/** Signed URLs for admin to view uploaded ID photos / experience letter */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: doc, error } = await admin
    .from("employee_info_docs")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = doc.form_data as {
    govtIdFrontPath?: string | null;
    govtIdBackPath?: string | null;
    experienceLetterPath?: string | null;
  };

  const paths = [form.govtIdFrontPath, form.govtIdBackPath, form.experienceLetterPath].filter(
    Boolean
  ) as string[];

  const urls: Record<string, string> = {};
  for (const path of paths) {
    const { data: signed } = await admin.storage.from(INFO_DOC_BUCKET).createSignedUrl(path, 3600);
    if (signed?.signedUrl) urls[path] = signed.signedUrl;
  }

  return NextResponse.json({ doc, fileUrls: urls });
}
