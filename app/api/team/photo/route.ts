import { NextRequest, NextResponse } from "next/server";
import { getOutreachEligibleMember } from "@/lib/team-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  processTeamPhoto,
  TEAM_PHOTO_BUCKET,
  TEAM_PHOTO_MAX_BYTES,
} from "@/lib/team-photo";

export async function POST(request: NextRequest) {
  const member = await getOutreachEligibleMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Photo file is required" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Please upload an image file (JPG, PNG, or WebP)." }, { status: 400 });
  }

  if (file.size > TEAM_PHOTO_MAX_BYTES) {
    return NextResponse.json({ error: "Photo must be under 8MB." }, { status: 400 });
  }

  const input = Buffer.from(await file.arrayBuffer());
  let processed: Buffer;
  try {
    processed = await processTeamPhoto(input);
  } catch {
    return NextResponse.json({ error: "Could not process that image. Try another photo." }, { status: 400 });
  }

  const admin = createAdminClient();
  const path = `${member.id}/avatar.jpg`;

  // Ensure bucket exists (migration 021) — create if missing so uploads work after deploy
  await admin.storage.createBucket(TEAM_PHOTO_BUCKET, {
    public: true,
    fileSizeLimit: TEAM_PHOTO_MAX_BYTES,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  }).catch(() => null);

  const { error: uploadError } = await admin.storage.from(TEAM_PHOTO_BUCKET).upload(path, processed, {
    contentType: "image/jpeg",
    upsert: true,
    cacheControl: "3600",
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: pub } = admin.storage.from(TEAM_PHOTO_BUCKET).getPublicUrl(path);
  // Cache-bust so the new photo shows immediately
  const photoUrl = `${pub.publicUrl}?v=${Date.now()}`;

  const { data: updated, error: updateError } = await admin
    .from("team_members")
    .update({
      photo_url: photoUrl,
      last_login: new Date().toISOString(),
    })
    .eq("id", member.id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ member: updated, photo_url: photoUrl });
}

export async function DELETE() {
  const member = await getOutreachEligibleMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const path = `${member.id}/avatar.jpg`;
  await admin.storage.from(TEAM_PHOTO_BUCKET).remove([path]);

  const { data: updated, error } = await admin
    .from("team_members")
    .update({ photo_url: null })
    .eq("id", member.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: updated, photo_url: null });
}
