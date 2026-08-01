import { NextRequest, NextResponse } from "next/server";
import { INFO_DOC_BUCKET } from "@/lib/info-doc";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const docId = String(form.get("docId") || "").trim();
  const kind = String(form.get("kind") || "").trim();

  if (!(file instanceof File) || !docId || !kind) {
    return NextResponse.json({ error: "file, docId, and kind required" }, { status: 400 });
  }

  if (!["govt_id_front", "govt_id_back", "experience_letter"].includes(kind)) {
    return NextResponse.json({ error: "Invalid upload kind" }, { status: 400 });
  }

  const allowed =
    kind === "experience_letter"
      ? ["image/jpeg", "image/png", "image/webp", "application/pdf"]
      : ["image/jpeg", "image/png", "image/webp"];

  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type for this upload" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
  }

  const admin = createAdminClient();
  const email = member.email.toLowerCase();

  const { data: doc } = await admin
    .from("employee_info_docs")
    .select("id, form_data")
    .eq("id", docId)
    .eq("status", "pending_fill")
    .or(`member_id.eq.${member.id},employee_email.eq.${email}`)
    .maybeSingle();

  if (!doc) {
    return NextResponse.json({ error: "Info Doc not found" }, { status: 404 });
  }

  await admin.storage.createBucket(INFO_DOC_BUCKET, {
    public: false,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  }).catch(() => null);

  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
  const path = `${member.id}/${docId}/${kind}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from(INFO_DOC_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const fieldKey =
    kind === "govt_id_front"
      ? "govtIdFrontPath"
      : kind === "govt_id_back"
        ? "govtIdBackPath"
        : "experienceLetterPath";

  const merged = { ...(doc.form_data as object), [fieldKey]: path };

  await admin
    .from("employee_info_docs")
    .update({ form_data: merged, updated_at: new Date().toISOString() })
    .eq("id", docId);

  return NextResponse.json({ path, kind, fieldKey });
}
